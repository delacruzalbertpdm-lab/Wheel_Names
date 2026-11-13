"""
REST API Views for PulseDraw Random Player Selection System.
"""

from django.db.models import Q, Count, Sum
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateDestroyAPIView

from core.models import Participant, DrawSession
from core.serializers import (
    ParticipantSerializer,
    DrawSessionSerializer,
    DrawExecuteRequestSerializer,
)
from core.services.selection_engine import execute_random_draw, SelectionValidationError
from core.services.file_importer import import_participants_from_file
from core.services.sample_seeder import seed_sample_participants, ensure_initial_seed


def get_pool_stats() -> dict:
    """Computes live participant pool counts."""
    ensure_initial_seed()
    total = Participant.objects.count()
    eligible = Participant.objects.filter(is_eligible=True).count()
    excluded = total - eligible
    departments = list(
        Participant.objects.values_list('department', flat=True).distinct().order_by('department')
    )
    return {
        'total_participants': total,
        'eligible_participants': eligible,
        'excluded_participants': excluded,
        'departments': [d for d in departments if d],
    }


class DashboardSummaryView(APIView):
    """Returns overview metrics, pool distribution, and recent draw activity."""

    def get(self, request):
        stats = get_pool_stats()
        total_draws = DrawSession.objects.count()
        total_winners_agg = DrawSession.objects.aggregate(total=Sum('requested_count'))
        total_winners_selected = total_winners_agg['total'] or 0

        recent_draws_qs = DrawSession.objects.prefetch_related('winners__participant').all()[:5]
        recent_draws_data = DrawSessionSerializer(recent_draws_qs, many=True).data
        latest_draw = recent_draws_data[0] if recent_draws_data else None

        department_breakdown = list(
            Participant.objects.values('department')
            .annotate(
                total=Count('id'),
                eligible=Count('id', filter=Q(is_eligible=True)),
            )
            .order_by('-total', 'department')
        )

        return Response({
            **stats,
            'total_draws': total_draws,
            'total_winners_selected': total_winners_selected,
            'latest_draw': latest_draw,
            'recent_draws': recent_draws_data,
            'department_breakdown': department_breakdown,
        })


class ParticipantListCreateView(APIView):
    """Lists participants with search/filter support or creates a new participant."""

    def get(self, request):
        queryset = Participant.objects.all()

        search = (request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(email__icontains=search)
                | Q(department__icontains=search)
            )

        is_eligible_param = request.query_params.get('is_eligible')
        if is_eligible_param is not None and is_eligible_param != '':
            if is_eligible_param.lower() in ('true', '1'):
                queryset = queryset.filter(is_eligible=True)
            elif is_eligible_param.lower() in ('false', '0'):
                queryset = queryset.filter(is_eligible=False)

        department_param = (request.query_params.get('department') or '').strip()
        if department_param:
            queryset = queryset.filter(department__iexact=department_param)

        serializer = ParticipantSerializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'stats': get_pool_stats(),
        })

    def post(self, request):
        serializer = ParticipantSerializer(data=request.data)
        if serializer.is_valid():
            participant = serializer.save()
            return Response(
                {
                    'participant': ParticipantSerializer(participant).data,
                    'stats': get_pool_stats(),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ParticipantDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieves, updates, or deletes an individual participant."""

    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'participant': serializer.data,
            'stats': get_pool_stats(),
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'stats': get_pool_stats()}, status=status.HTTP_200_OK)


class ParticipantImportView(APIView):
    """Handles batch importing participants from CSV or Excel (.xlsx) files."""

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {'error': 'No file was provided. Please attach a .csv or .xlsx file under the "file" field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            created_count, skipped_count, created_records = import_participants_from_file(uploaded_file)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'error': f'Failed to parse uploaded file: {str(exc)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'message': f'Successfully imported {created_count} participant(s).',
                'created_count': created_count,
                'skipped_duplicates_count': skipped_count,
                'created_participants': ParticipantSerializer(created_records, many=True).data,
                'stats': get_pool_stats(),
            },
            status=status.HTTP_201_CREATED,
        )


class ParticipantResetEligibilityView(APIView):
    """Resets `is_eligible=True` for all registered participants."""

    def post(self, request):
        updated_count = Participant.objects.filter(is_eligible=False).update(is_eligible=True)
        return Response({
            'message': f'Eligibility restored for {updated_count} participant(s). All participants are now eligible.',
            'restored_count': updated_count,
            'stats': get_pool_stats(),
        })


class ParticipantSeedSampleView(APIView):
    """Seeds 20 realistic sample participants so administrators can immediately run draws."""

    def post(self, request):
        created_count = seed_sample_participants()
        return Response({
            'message': f'Added {created_count} sample participant(s) to the pool.',
            'created_count': created_count,
            'stats': get_pool_stats(),
        })


class ParticipantBulkDeleteView(APIView):
    """Deletes either a specified list of participant IDs or all participants."""

    def post(self, request):
        ids = request.data.get('ids')
        if isinstance(ids, list) and ids:
            deleted_count, _ = Participant.objects.filter(id__in=ids).delete()
        else:
            deleted_count, _ = Participant.objects.all().delete()
        return Response({
            'message': f'Removed {deleted_count} participant(s).',
            'deleted_count': deleted_count,
            'stats': get_pool_stats(),
        })


class DrawExecuteView(APIView):
    """
    Executes a simultaneous random draw of `requested_count` players using
    Python's `secrets.SystemRandom` on the backend.
    """

    def post(self, request):
        req_serializer = DrawExecuteRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid draw parameters.',
                    'code': 'invalid_parameters',
                    'details': req_serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = req_serializer.validated_data
        try:
            draw_session = execute_random_draw(
                requested_count=validated['requested_count'],
                exclude_winners=validated.get('exclude_winners', True),
                title=validated.get('title', 'Quick Selection Draw'),
                idempotency_key=validated.get('idempotency_key'),
            )
        except SelectionValidationError as exc:
            return Response(
                {
                    'error': exc.message,
                    'code': exc.code,
                    'details': exc.details,
                    'stats': get_pool_stats(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'draw': DrawSessionSerializer(draw_session).data,
                'stats': get_pool_stats(),
            },
            status=status.HTTP_201_CREATED,
        )


class DrawHistoryListView(APIView):
    """Returns chronological draw history with nested winners."""

    def get(self, request):
        queryset = DrawSession.objects.prefetch_related('winners__participant').all()
        search = (request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(winners__participant_name_snapshot__icontains=search)
                | Q(winners__participant_department_snapshot__icontains=search)
            ).distinct()

        serializer = DrawSessionSerializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'total_draws': DrawSession.objects.count(),
            'stats': get_pool_stats(),
        })


class DrawHistoryDetailView(APIView):
    """Deletes a single draw session from history."""

    def delete(self, request, pk):
        try:
            session = DrawSession.objects.get(pk=pk)
        except DrawSession.DoesNotExist:
            return Response({'error': 'Draw record not found.'}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response({
            'message': 'Draw history entry deleted.',
            'total_draws': DrawSession.objects.count(),
        })


class DrawHistoryClearView(APIView):
    """Clears all draw history records."""

    def delete(self, request):
        deleted_count, _ = DrawSession.objects.all().delete()
        return Response({
            'message': 'All draw history records have been cleared.',
            'deleted_count': deleted_count,
            'total_draws': 0,
        })
