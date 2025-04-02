from django.urls import path



from .views import (
    # Dashboards
    admin_dashboard,
    tech_dashboard,
    client_dashboard,

    # Admin-specific views
    add_admin,
    add_technician,
    manage_users,
    inactive_users,
    deactivate_user,
    toggle_user_status,
    delete_user,
    delete_inactive_user,

    # Location-related views
    load_countries,
    load_departments,
    load_provinces,
    load_districts,

    # Online users
    fetch_online_users,

    # Client-specific views
    client_chat,
    client_diagnosis,
    client_diagnosis_data,
    client_comparison,
    defender_status_api,
    client_maintenance,
    client_recommendations,
    client_learning_center,

    # Maintenance-specific views
    client_clear_space,
    client_update_software,
    client_defragment_disk,
    client_repair_disk,

    # Monitoring views (pages)
    client_monitoring_cpu,
    client_monitoring_ram,
    client_monitoring_disk,
    client_monitoring_gpu,

    # Monitoring views (API data)
    cpu_monitoring_data,
    ram_monitoring_data,
    disk_monitoring_data,
    gpu_monitoring_data,

    # Videos
    video_list,
    video_create,
    video_update,
    video_delete,
    user_logout,
    
    #TECH.
    tech_profile,
    tech_cases,
    tech_reports,
    change_connection_status
)

urlpatterns = [
    # Dashboards
    path("admin/", admin_dashboard, name="admin_dashboard"),
    path("tech/", tech_dashboard, name="tech_dashboard"),
    path("client/", client_dashboard, name="client_dashboard"),
    path('logout/', user_logout, name='logout'),

    # Admin routes
    path("add-technician/", add_technician, name="add_technician"),
    path("add-admin/", add_admin, name="add_admin"),
    path("manage-users/", manage_users, name="manage_users"),
    path("inactive-users/", inactive_users, name="inactive_users"),
    path("deactivate-user/<int:user_id>/", deactivate_user, name="deactivate_user"),
    path("toggle-user-status/<int:user_id>/", toggle_user_status, name="toggle_user_status"),
    path("delete-user/<int:user_id>/", delete_user, name="delete_user"),
    path("delete-inactive-user/<int:user_id>/", delete_inactive_user, name="delete_inactive_user"),

    # Location routes
    path("load-countries/", load_countries, name="load_countries"),
    path("load-departments/", load_departments, name="load_departments"),
    path("load-provinces/", load_provinces, name="load_provinces"),
    path("load-districts/", load_districts, name="load_districts"),

    # Online users
    path("online-users/", fetch_online_users, name="fetch_online_users"),

    # Client routes
    path("client/diagnosis/", client_diagnosis, name="client_diagnosis"),  
    path("client/diagnosis/data/", client_diagnosis_data, name="client_diagnosis_data"),
    path("client/diagnosis/comparison/", client_comparison, name="client_comparison"),
    path("client/diagnosis/defender/status/", defender_status_api, name="defender_status_api"),
    path("client/maintenance/", client_maintenance, name="client_maintenance"),
    path("client/recommendations/", client_recommendations, name="client_recommendations"),
    path("client/learning-center/", client_learning_center, name="client_learning_center"),
    path("client/chat/", client_chat, name="client_chat"),

    # Maintenance routes
    path("client/maintenance/clear-space/", client_clear_space, name="client_clear_space"),
    path("client/maintenance/update-software/", client_update_software, name="client_update_software"),
    path("client/maintenance/defragment-disk/", client_defragment_disk, name="client_defragment_disk"),
    path("client/maintenance/repair-disk/", client_repair_disk, name="client_repair_disk"),

    # Monitoring routes (pages)
    path("client/monitoring/cpu/", client_monitoring_cpu, name="client_monitoring_cpu"),
    path("client/monitoring/ram/", client_monitoring_ram, name="client_monitoring_ram"),
    path("client/monitoring/disk/", client_monitoring_disk, name="client_monitoring_disk"),
    path("client/monitoring/gpu/", client_monitoring_gpu, name="client_monitoring_gpu"),

    # Monitoring routes (API data)
    path("client/monitoring/cpu/data/", cpu_monitoring_data, name="client_monitoring_cpu_data"),
    path("client/monitoring/ram/data/", ram_monitoring_data, name="client_monitoring_ram_data"),
    path("client/monitoring/disk/data/", disk_monitoring_data, name="client_monitoring_disk_data"),
    path("client/monitoring/gpu/data/", gpu_monitoring_data, name="client_monitoring_gpu_data"),

    # Videos
    path("videos/", video_list, name="video_list"),
    path("videos/create/", video_create, name="video_create"),
    path("videos/<int:pk>/edit/", video_update, name="video_update"),
    path("videos/<int:pk>/delete/", video_delete, name="video_delete"),

    #TECH.
    path('tech/profile/', tech_profile, name='tech_profile'),
    path('tech/cases/', tech_cases, name='tech_cases'),
    path('tech/reports/', tech_reports, name='tech_reports'),
    path('tech/change_connection_status/', change_connection_status, name='change_connection_status')
]
