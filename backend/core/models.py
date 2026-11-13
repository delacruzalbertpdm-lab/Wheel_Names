"""
Database models for PulseDraw Random Player Selection System.
Uses UUID primary keys and standard relational constraints for seamless
compatibility with both SQLite (local) and PostgreSQL / Supabase (production).
"""

import uuid
from django.db import models


AVATAR_PALETTE = [
    '#6366F1',  # Indigo
    '#06B6D4',  # Cyan
    '#10B981',  # Emerald
    '#8B5CF6',  # Violet
    '#F59E0B',  # Amber
    '#EC4899',  # Pink
    '#3B82F6',  # Blue
    '#14B8A6',  # Teal
]


def pick_avatar_color(seed_text: str) -> str:
    """Deterministically selects an attractive badge color from the palette."""
    if not seed_text:
        return AVATAR_PALETTE[0]
    index = sum(ord(ch) for ch in seed_text) % len(AVATAR_PALETTE)
    return AVATAR_PALETTE[index]


class Participant(models.Model):
    """Represents a registered participant eligible for random selection draws."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(max_length=254, blank=True, default='')
    department = models.CharField(max_length=100, blank=True, default='General', db_index=True)
    avatar_color = models.CharField(max_length=20, blank=True, default='#6366F1')
    is_eligible = models.BooleanField(default=True, db_index=True)
    times_selected = models.PositiveIntegerField(default=0)
    last_selected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name', '-created_at']
        indexes = [
            models.Index(fields=['is_eligible', 'full_name']),
        ]

    def save(self, *args, **kwargs):
        if not self.avatar_color:
            self.avatar_color = pick_avatar_color(self.full_name)
        if not self.department or not self.department.strip():
            self.department = 'General'
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        status = 'Eligible' if self.is_eligible else 'Excluded'
        return f"{self.full_name} ({status})"


class DrawSession(models.Model):
    """Records a single simultaneous random selection draw event."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150, blank=True, default='Quick Selection Draw')
    requested_count = models.PositiveIntegerField()
    total_pool_size = models.PositiveIntegerField()
    eligible_pool_size = models.PositiveIntegerField()
    exclude_winners = models.BooleanField(default=True)
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.title} ({self.requested_count} winners @ {self.created_at.isoformat()})"


class DrawWinner(models.Model):
    """
    Records each participant selected within a DrawSession.
    Stores snapshots of participant metadata so history remains accurate
    even if a participant record is later edited or deleted.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    draw_session = models.ForeignKey(
        DrawSession,
        on_delete=models.CASCADE,
        related_name='winners',
    )
    participant = models.ForeignKey(
        Participant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='draw_wins',
    )
    participant_name_snapshot = models.CharField(max_length=150)
    participant_department_snapshot = models.CharField(max_length=100, blank=True, default='General')
    participant_email_snapshot = models.EmailField(max_length=254, blank=True, default='')
    avatar_color_snapshot = models.CharField(max_length=20, blank=True, default='#6366F1')
    slot_number = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['slot_number']
        unique_together = [('draw_session', 'slot_number')]

    def __str__(self) -> str:
        return f"#{self.slot_number} {self.participant_name_snapshot} ({self.draw_session_id})"

