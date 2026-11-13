"""
Cryptographic Random Selection Engine for PulseDraw.

Responsibilities:
- Enforces server-side randomness using Python's OS-backed CSPRNG (`secrets.SystemRandom`).
- Guarantees zero duplicate selections within the same draw (`SystemRandom.sample`).
- Protects against simultaneous / duplicate draw requests via atomic database locking
  (`select_for_update`) and optional idempotency keys.
- Automatically updates participant eligibility when `exclude_winners=True`.
- Persists immutable draw snapshots (`DrawSession` and `DrawWinner`).
"""

import secrets
from typing import Optional
from django.db import transaction
from django.utils import timezone
from core.models import Participant, DrawSession, DrawWinner


class SelectionValidationError(Exception):
    """Raised when a draw request fails pool or parameter validation."""

    def __init__(self, message: str, code: str = 'invalid_draw_request', details: Optional[dict] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


_secure_random = secrets.SystemRandom()


def execute_random_draw(
    *,
    requested_count: int,
    exclude_winners: bool = True,
    title: str = 'Quick Selection Draw',
    idempotency_key: Optional[str] = None,
) -> DrawSession:
    """
    Atomically selects `requested_count` unique eligible participants using
    cryptographic randomness, updates eligibility/counters, and records the DrawSession.
    """
    if requested_count is None or int(requested_count) < 1:
        raise SelectionValidationError(
            message='The number of players to select must be at least 1.',
            code='invalid_count',
        )

    requested_count = int(requested_count)
    clean_title = (title or 'Quick Selection Draw').strip()[:150] or 'Quick Selection Draw'
    clean_idempotency = idempotency_key.strip()[:100] if idempotency_key and idempotency_key.strip() else None

    with transaction.atomic():
        # 1. Check idempotency key to prevent accidental double-submission
        if clean_idempotency:
            existing_session = (
                DrawSession.objects.prefetch_related('winners__participant')
                .filter(idempotency_key=clean_idempotency)
                .first()
            )
            if existing_session is not None:
                return existing_session

        # 2. Acquire row-level locks on participants to serialize concurrent draws
        all_participants_qs = Participant.objects.select_for_update().all()
        total_pool_size = all_participants_qs.count()

        if total_pool_size == 0:
            raise SelectionValidationError(
                message='No participants are registered yet. Please add or import participants before starting a draw.',
                code='empty_participant_pool',
                details={'total_participants': 0, 'eligible_participants': 0, 'requested_count': requested_count},
            )

        eligible_participants = list(all_participants_qs.filter(is_eligible=True))
        eligible_pool_size = len(eligible_participants)

        if eligible_pool_size == 0:
            raise SelectionValidationError(
                message='There are currently 0 eligible participants remaining. Please reset participant eligibility to continue.',
                code='no_eligible_participants',
                details={
                    'total_participants': total_pool_size,
                    'eligible_participants': 0,
                    'requested_count': requested_count,
                },
            )

        if requested_count > eligible_pool_size:
            raise SelectionValidationError(
                message=(
                    f"Not enough eligible participants for this draw. You requested {requested_count} "
                    f"player{'s' if requested_count != 1 else ''}, but only {eligible_pool_size} "
                    f"eligible participant{'s are' if eligible_pool_size != 1 else ' is'} available."
                ),
                code='insufficient_eligible_participants',
                details={
                    'total_participants': total_pool_size,
                    'eligible_participants': eligible_pool_size,
                    'requested_count': requested_count,
                },
            )

        # 3. Cryptographically random simultaneous sampling without replacement
        selected_participants = _secure_random.sample(eligible_participants, k=requested_count)

        # 4. Create the DrawSession record
        now = timezone.now()
        draw_session = DrawSession.objects.create(
            title=clean_title,
            requested_count=requested_count,
            total_pool_size=total_pool_size,
            eligible_pool_size=eligible_pool_size,
            exclude_winners=bool(exclude_winners),
            idempotency_key=clean_idempotency,
        )

        # 5. Create DrawWinner records and update selected Participant statistics & eligibility
        winner_records = []
        selected_ids = []

        for slot_idx, participant in enumerate(selected_participants, start=1):
            selected_ids.append(participant.id)
            winner_records.append(
                DrawWinner(
                    draw_session=draw_session,
                    participant=participant,
                    participant_name_snapshot=participant.full_name,
                    participant_department_snapshot=participant.department,
                    participant_email_snapshot=participant.email,
                    avatar_color_snapshot=participant.avatar_color,
                    slot_number=slot_idx,
                )
            )
            participant.times_selected += 1
            participant.last_selected_at = now
            if exclude_winners:
                participant.is_eligible = False

        DrawWinner.objects.bulk_create(winner_records)
        Participant.objects.bulk_update(
            selected_participants,
            fields=['times_selected', 'last_selected_at', 'is_eligible', 'updated_at'],
        )

        return DrawSession.objects.prefetch_related('winners__participant').get(pk=draw_session.pk)

