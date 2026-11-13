from django.core.management.base import BaseCommand
from core.services.sample_seeder import seed_sample_participants


class Command(BaseCommand):
    help = 'Seeds 20 sample participants into the database if not already present.'

    def handle(self, *args, **options):
        created = seed_sample_participants()
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} sample participant(s).'))

