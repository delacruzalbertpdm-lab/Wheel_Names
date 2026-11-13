from django.contrib import admin
from .models import Participant, DrawSession, DrawWinner


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'email', 'is_eligible', 'times_selected', 'last_selected_at')
    list_filter = ('is_eligible', 'department')
    search_fields = ('full_name', 'email', 'department')


class DrawWinnerInline(admin.TabularInline):
    model = DrawWinner
    extra = 0
    readonly_fields = ('slot_number', 'participant_name_snapshot', 'participant_department_snapshot')


@admin.register(DrawSession)
class DrawSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'requested_count', 'eligible_pool_size', 'total_pool_size', 'exclude_winners', 'created_at')
    list_filter = ('exclude_winners', 'created_at')
    inlines = [DrawWinnerInline]

