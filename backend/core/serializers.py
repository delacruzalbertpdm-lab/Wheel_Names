"""
DRF Serializers for Participants, Draw Execution, and Draw History.
"""

from rest_framework import serializers
from core.models import Participant, DrawSession, DrawWinner, pick_avatar_color


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = [
            'id',
            'full_name',
            'email',
            'department',
            'avatar_color',
            'is_eligible',
            'times_selected',
            'last_selected_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'times_selected', 'last_selected_at', 'created_at', 'updated_at']

    def validate_full_name(self, value: str) -> str:
        cleaned = (value or '').strip()
        if not cleaned:
            raise serializers.ValidationError('Participant full name cannot be empty.')

        qs = Participant.objects.filter(full_name__iexact=cleaned)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f'A participant named "{cleaned}" is already registered.')
        return cleaned

    def validate_department(self, value: str) -> str:
        cleaned = (value or '').strip()
        return cleaned if cleaned else 'General'

    def create(self, validated_data):
        if not validated_data.get('avatar_color'):
            validated_data['avatar_color'] = pick_avatar_color(validated_data.get('full_name', ''))
        return super().create(validated_data)


class DrawWinnerSerializer(serializers.ModelSerializer):
    participant_id = serializers.UUIDField(source='participant.id', read_only=True, allow_null=True)

    class Meta:
        model = DrawWinner
        fields = [
            'id',
            'participant_id',
            'participant_name_snapshot',
            'participant_department_snapshot',
            'participant_email_snapshot',
            'avatar_color_snapshot',
            'slot_number',
        ]


class DrawSessionSerializer(serializers.ModelSerializer):
    winners = DrawWinnerSerializer(many=True, read_only=True)

    class Meta:
        model = DrawSession
        fields = [
            'id',
            'title',
            'requested_count',
            'total_pool_size',
            'eligible_pool_size',
            'exclude_winners',
            'created_at',
            'winners',
        ]


class DrawExecuteRequestSerializer(serializers.Serializer):
    requested_count = serializers.IntegerField(min_value=1)
    exclude_winners = serializers.BooleanField(default=True, required=False)
    title = serializers.CharField(max_length=150, required=False, allow_blank=True, default='Quick Selection Draw')
    idempotency_key = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)

