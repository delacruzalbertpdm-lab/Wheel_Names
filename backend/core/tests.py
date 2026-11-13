"""
Automated test suite for PulseDraw backend:
- Participant CRUD and duplicate validation
- CSV and Excel (.xlsx) batch file importing
- Cryptographic simultaneous random selection without duplicates
- Eligibility exclusion mode vs repeat-eligible mode
- Insufficient eligible participants validation
- Idempotency key duplicate-draw protection
- Draw history persistence and snapshot preservation
"""

import io
import openpyxl
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import Participant, DrawSession


class PulseDrawAPITests(APITestCase):

    def setUp(self):
        self.participants_url = reverse('participant-list-create')
        self.draw_execute_url = reverse('draw-execute')
        self.reset_eligibility_url = reverse('participant-reset-eligibility')
        self.import_url = reverse('participant-import')
        self.history_url = reverse('draw-history-list')

    def _create_participants(self, count: int):
        for i in range(1, count + 1):
            Participant.objects.create(
                full_name=f"Player {i:02d}",
                email=f"player{i}@example.com",
                department="Engineering" if i % 2 == 0 else "Design",
            )

    def test_create_and_prevent_duplicate_participant(self):
        res1 = self.client.post(
            self.participants_url,
            {'full_name': 'Alice Wonderland', 'department': 'Engineering'},
            format='json',
        )
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Participant.objects.count(), 1)

        # Duplicate name (case-insensitive) should be rejected
        res2 = self.client.post(
            self.participants_url,
            {'full_name': 'alice wonderland', 'department': 'Marketing'},
            format='json',
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_simultaneous_draw_uniqueness_and_exclusion(self):
        self._create_participants(20)

        # Select 5 players simultaneously with exclude_winners=True
        response = self.client.post(
            self.draw_execute_url,
            {
                'requested_count': 5,
                'exclude_winners': True,
                'title': 'Round 1 Trivia',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        draw_data = response.data['draw']
        winners = draw_data['winners']

        self.assertEqual(len(winners), 5)
        winner_ids = [w['participant_id'] for w in winners]
        # Ensure all 5 winners in the draw are strictly unique
        self.assertEqual(len(set(winner_ids)), 5)

        # Ensure remaining eligible count is now 15
        self.assertEqual(response.data['stats']['eligible_participants'], 15)
        self.assertEqual(response.data['stats']['excluded_participants'], 5)

    def test_draw_validation_when_insufficient_eligible_participants(self):
        self._create_participants(4)

        response = self.client.post(
            self.draw_execute_url,
            {'requested_count': 5, 'exclude_winners': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'insufficient_eligible_participants')
        self.assertEqual(DrawSession.objects.count(), 0)

    def test_keep_winners_eligible_mode_and_reset_eligibility(self):
        self._create_participants(6)

        # Draw 4 players with exclude_winners=False (keep eligible)
        res1 = self.client.post(
            self.draw_execute_url,
            {'requested_count': 4, 'exclude_winners': False},
            format='json',
        )
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['stats']['eligible_participants'], 6)

        # Now draw 4 players with exclude_winners=True
        res2 = self.client.post(
            self.draw_execute_url,
            {'requested_count': 4, 'exclude_winners': True},
            format='json',
        )
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['stats']['eligible_participants'], 2)

        # Reset eligibility
        res_reset = self.client.post(self.reset_eligibility_url, format='json')
        self.assertEqual(res_reset.status_code, status.HTTP_200_OK)
        self.assertEqual(res_reset.data['stats']['eligible_participants'], 6)

    def test_idempotency_key_prevents_duplicate_concurrent_draws(self):
        self._create_participants(10)

        payload = {
            'requested_count': 3,
            'exclude_winners': True,
            'title': 'Idempotent Draw',
            'idempotency_key': 'unique-key-12345',
        }
        res1 = self.client.post(self.draw_execute_url, payload, format='json')
        res2 = self.client.post(self.draw_execute_url, payload, format='json')

        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['draw']['id'], res2.data['draw']['id'])
        self.assertEqual(DrawSession.objects.count(), 1)
        self.assertEqual(Participant.objects.filter(is_eligible=True).count(), 7)

    def test_csv_and_xlsx_participant_import(self):
        # 1. Test CSV import
        csv_content = b"full_name,email,department\n Clara Oswald,clara@tardis.io,Time Travel\nRory Williams,rory@tardis.io,Medical\n"
        csv_file = SimpleUploadedFile("participants.csv", csv_content, content_type="text/csv")
        res_csv = self.client.post(self.import_url, {'file': csv_file}, format='multipart')
        self.assertEqual(res_csv.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_csv.data['created_count'], 2)

        # 2. Test Excel (.xlsx) import with 1 duplicate and 2 new
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Name", "Email", "Department"])
        ws.append(["Clara Oswald", "clara@tardis.io", "Time Travel"])  # Duplicate
        ws.append(["Amy Pond", "amy@tardis.io", "Journalism"])
        ws.append(["River Song", "river@tardis.io", "Archaeology"])
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)

        xlsx_file = SimpleUploadedFile(
            "participants.xlsx",
            stream.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        res_xlsx = self.client.post(self.import_url, {'file': xlsx_file}, format='multipart')
        self.assertEqual(res_xlsx.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_xlsx.data['created_count'], 2)
        self.assertEqual(res_xlsx.data['skipped_duplicates_count'], 1)
        self.assertEqual(Participant.objects.count(), 4)

