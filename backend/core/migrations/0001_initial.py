# Generated initial migration for PulseDraw core models

import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='DrawSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(blank=True, default='Quick Selection Draw', max_length=150)),
                ('requested_count', models.PositiveIntegerField()),
                ('total_pool_size', models.PositiveIntegerField()),
                ('eligible_pool_size', models.PositiveIntegerField()),
                ('exclude_winners', models.BooleanField(default=True)),
                ('idempotency_key', models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Participant',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('full_name', models.CharField(db_index=True, max_length=150)),
                ('email', models.EmailField(blank=True, default='', max_length=254)),
                ('department', models.CharField(blank=True, db_index=True, default='General', max_length=100)),
                ('avatar_color', models.CharField(blank=True, default='#6366F1', max_length=20)),
                ('is_eligible', models.BooleanField(db_index=True, default=True)),
                ('times_selected', models.PositiveIntegerField(default=0)),
                ('last_selected_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['full_name', '-created_at'],
                'indexes': [
                    models.Index(fields=['is_eligible', 'full_name'], name='core_partic_is_elig_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='DrawWinner',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('participant_name_snapshot', models.CharField(max_length=150)),
                ('participant_department_snapshot', models.CharField(blank=True, default='General', max_length=100)),
                ('participant_email_snapshot', models.EmailField(blank=True, default='', max_length=254)),
                ('avatar_color_snapshot', models.CharField(blank=True, default='#6366F1', max_length=20)),
                ('slot_number', models.PositiveIntegerField(default=1)),
                (
                    'draw_session',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='winners',
                        to='core.drawsession',
                    ),
                ),
                (
                    'participant',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='draw_wins',
                        to='core.participant',
                    ),
                ),
            ],
            options={
                'ordering': ['slot_number'],
                'unique_together': {('draw_session', 'slot_number')},
            },
        ),
    ]

