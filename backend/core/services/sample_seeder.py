"""
Sample data seeder providing 20 realistic participants across departments
so administrators can immediately test simultaneous draws of 3, 4, or 5 players.
"""

import sys
from pathlib import Path
from django.conf import settings
from django.db import transaction
from core.models import Participant, pick_avatar_color


DEFAULT_SAMPLE_PARTICIPANTS = [
    ("Elena Rostova", "elena.rostova@pulsedraw.io", "Engineering"),
    ("Marcus Vance", "marcus.vance@pulsedraw.io", "Product Design"),
    ("Sophia Chen", "sophia.chen@pulsedraw.io", "Data Science"),
    ("Liam O'Connor", "liam.oconnor@pulsedraw.io", "Engineering"),
    ("Amara Okafor", "amara.okafor@pulsedraw.io", "Marketing"),
    ("Noah Takahashi", "noah.takahashi@pulsedraw.io", "Cloud Ops"),
    ("Zara Al-Mansoor", "zara.almansoor@pulsedraw.io", "Product Management"),
    ("Mateo Silva", "mateo.silva@pulsedraw.io", "Customer Success"),
    ("Chloe Dubois", "chloe.dubois@pulsedraw.io", "Product Design"),
    ("Ethan Brooks", "ethan.brooks@pulsedraw.io", "Engineering"),
    ("Priya Patel", "priya.patel@pulsedraw.io", "Data Science"),
    ("Lucas Lindqvist", "lucas.lindqvist@pulsedraw.io", "Security"),
    ("Hannah Kim", "hannah.kim@pulsedraw.io", "Marketing"),
    ("Daniel Morales", "daniel.morales@pulsedraw.io", "Engineering"),
    ("Ava Kowalski", "ava.kowalski@pulsedraw.io", "People & Culture"),
    ("Benjamin Wright", "benjamin.wright@pulsedraw.io", "Finance"),
    ("Maya Lin", "maya.lin@pulsedraw.io", "Product Management"),
    ("Oliver Sterling", "oliver.sterling@pulsedraw.io", "Cloud Ops"),
    ("Isabella Rossi", "isabella.rossi@pulsedraw.io", "Customer Success"),
    ("Samuel Mensah", "samuel.mensah@pulsedraw.io", "Security"),
]


def seed_sample_participants() -> int:
    """Seeds up to 20 sample participants if not already present. Returns count created."""
    with transaction.atomic():
        existing_names = {
            name.strip().lower()
            for name in Participant.objects.values_list('full_name', flat=True)
        }
        to_create = []
        for full_name, email, department in DEFAULT_SAMPLE_PARTICIPANTS:
            if full_name.lower() not in existing_names:
                existing_names.add(full_name.lower())
                to_create.append(
                    Participant(
                        full_name=full_name,
                        email=email,
                        department=department,
                        avatar_color=pick_avatar_color(full_name),
                        is_eligible=True,
                    )
                )
        created = Participant.objects.bulk_create(to_create)
        return len(created)


def ensure_initial_seed() -> None:
    """Seeds initial 20 participants once on a fresh non-test database."""
    if 'test' in sys.argv:
        return
    marker_path = Path(settings.BASE_DIR) / '.initial_seeded'
    if marker_path.exists():
        return
    try:
        if Participant.objects.count() == 0:
            seed_sample_participants()
        marker_path.write_text('seeded', encoding='utf-8')
    except Exception:
        pass

