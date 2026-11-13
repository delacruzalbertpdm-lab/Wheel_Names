from django.urls import path
from core.views import (
    DashboardSummaryView,
    ParticipantListCreateView,
    ParticipantDetailView,
    ParticipantImportView,
    ParticipantResetEligibilityView,
    ParticipantSeedSampleView,
    ParticipantBulkDeleteView,
    DrawExecuteView,
    DrawHistoryListView,
    DrawHistoryDetailView,
    DrawHistoryClearView,
)

urlpatterns = [
    # Dashboard
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),

    # Participants CRUD & Management
    path('participants/', ParticipantListCreateView.as_view(), name='participant-list-create'),
    path('participants/import/', ParticipantImportView.as_view(), name='participant-import'),
    path('participants/reset-eligibility/', ParticipantResetEligibilityView.as_view(), name='participant-reset-eligibility'),
    path('participants/seed-sample/', ParticipantSeedSampleView.as_view(), name='participant-seed-sample'),
    path('participants/bulk-delete/', ParticipantBulkDeleteView.as_view(), name='participant-bulk-delete'),
    path('participants/<uuid:pk>/', ParticipantDetailView.as_view(), name='participant-detail'),

    # Random Selection & Draw History
    path('draws/execute/', DrawExecuteView.as_view(), name='draw-execute'),
    path('draws/clear/', DrawHistoryClearView.as_view(), name='draw-history-clear'),
    path('draws/<uuid:pk>/', DrawHistoryDetailView.as_view(), name='draw-history-detail'),
    path('draws/', DrawHistoryListView.as_view(), name='draw-history-list'),
]

