from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from .views import (
    # Dashboards
    admin_inicio,
    admin_dashboard,
    tech_dashboard,
    client_dashboard,

    # Admin-specific views
    add_admin,
    
    # Técnico - CRUD
    read_technician,
    add_technician,
    update_technician,
    count_tech,
    list_technician,
    # Client-crud
    add_client,
    read_client, 
    update_client,
    #manage_users, #borrar
    inactive_users,
    deactivate_user,
    toggle_user_status,
    delete_user,
    delete_inactive_user,

    # Tickets
    status_tickets,
    
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
    client_historial,
    speed_test,

    # Maintenance-specific views
    client_clear_space,
    client_update_software,
    client_defragment_disk,
    client_repair_disk, 
    get_largest_temp_files,
    get_system_temp_info,
    client_clear_specific_temp, 

    #Mapa
    google_maps,
    # Monitoring views (pages)
    client_monitoring_cpu,
    client_monitoring_ram,
    client_monitoring_disk,
    client_monitoring_gpu,
    system_security_info,
    system_virus_scan,

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

    #TECH.
    tech_profile,
    tech_cases,
    tech_reports,
    change_connection_status,
    chatIA,
    #news
    client_diagnosis_data,
    start_diagnostic_scan,
    get_diagnostic_progress,
    get_diagnostic_report,
    run_diagnostic_scenario,
    get_scenario_result,
    mark_issue_resolved,
    get_latest_diagnosis_result,
    download_diagnostic_file,
    system_updates_info,
    fix_all_drivers,
    fix_driver,
    download_driver,
    scan_drivers,
    restart_system,
    speech_to_text,
    transcribe_audio,
    product_create,
    product_update,
    product_delete,
    product_list,
    category_create,
    category_update,
    category_delete,
    category_list,
    sales_report,
    client_recommendations_api,
    add_to_cart,
    serve_media_file,
    
        
)

urlpatterns = [
    #chat
    path('chatIA/', chatIA, name='chat'),
    path('api/transcribe-audio/', transcribe_audio, name='transcribe_audio'),
    # Dashboards
    path("admin/", admin_inicio, name="admin_inicio"),
    path("adminDashboard/", admin_dashboard, name="admin_dashboard"),
    path("tech/", tech_dashboard, name="tech_dashboard"),
    path("client/", client_dashboard, name="client_dashboard"),

    # Admin routes
    path("tecnicos/", read_technician, name = "read_technician"),
    path("add-admin/", add_admin, name="add_admin"),
    path("inactive-users/", inactive_users, name="inactive_users"),
    path("deactivate-user/<int:user_id>/", deactivate_user, name="deactivate_user"),
    path("toggle-user-status/<int:user_id>/", toggle_user_status, name="toggle_user_status"),
    path("delete-user/<int:user_id>/", delete_user, name="delete_user"),
    path("delete-inactive-user/<int:user_id>/", delete_inactive_user, name="delete_inactive_user"),
    # Clientes
    path("clientes/", read_client, name="read_client"),
    path("clientes/agregar/", add_client, name = "add_client"),
    path('clientes/update/<int:pk>/', update_client, name='update_client'),
    #Técnicos
    path('tecnicos/listar/', list_technician, name='list_technician'),
    path("tecnicos/agregar/", add_technician, name = "add_technician"),
    path('tecnicos/update/<int:pk>/', update_technician, name='update_technician'),
    path('tecnicos/conteo/',count_tech, name = "count_tech"),
    #Tickets
    path("tickets/conteo/<int:year>/<int:idTech>/", status_tickets, name="status_tickets"), 
    path('tickets/conteo/<int:year>/', status_tickets, name='status_tickets_general'),
    #path("manage-users/", manage_users, name="manage_users"), #borrar

    # Location routes
    path("load-countries/", load_countries, name="load_countries"),
    path("load-departments/", load_departments, name="load_departments"),
    path("load-provinces/", load_provinces, name="load_provinces"),
    path("load-districts/", load_districts, name="load_districts"),

    # Online users
    path("online-users/", fetch_online_users, name="fetch_online_users"),

    # Client routes
    path("client/diagnosis/", client_diagnosis, name="client_diagnosis"),  
    path("client/diagnosis-data/", client_diagnosis_data, name="client_diagnosis_data"),
    path("client/diagnosis/comparison/", client_comparison, name="client_comparison"),
    path("client/diagnosis/defender/status/", defender_status_api, name="defender_status_api"),
    path("client/maintenance/", client_maintenance, name="client_maintenance"),
    path("client/recommendations/", client_recommendations, name="client_recommendations"),
    path("client/learning-center/", client_learning_center, name="client_learning_center"),
    path("client/chat/", client_chat, name="client_chat"),
    path("client/historial/", client_historial, name="client_historial"),
    path('speed-test/', speed_test, name='speed_test'),

    # Mantenimiento y limpieza de archivos
    path("client/maintenance/clear-space/", client_clear_space, name="client_maintenance_clear_space"),
    path("client/maintenance/update-software/", client_update_software, name="client_update_software"),
    path("client/maintenance/defragment-disk/", client_defragment_disk, name="client_defragment_disk"),
    path("client/maintenance/repair-disk/", client_repair_disk, name="client_repair_disk"),
    path('client/clear-space/', client_clear_space, name='client_clear_space'),
    path('client/get-largest-temp-files/', get_largest_temp_files, name='get_largest_temp_files'),
    path('client/clear-specific-temp/', client_clear_specific_temp, name='client_clear_specific_temp'),
    path('client/get-system-temp-info/', get_system_temp_info, name='get_system_temp_info'),
    path('system/virus-scan/', system_virus_scan, name='system_virus_scan'),
    path('system/security-info/', system_security_info, name='system_security_info'),
        
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
    path('tech/change_connection_status/', change_connection_status, name='change_connection_status'),
    
    #news
    # APIs para el sistema de diagnóstico
    path('api/diagnosis-data/', client_diagnosis_data, name='client_diagnosis_data'),
    path('api/diagnosis/start/', start_diagnostic_scan, name='start_diagnostic_scan'),
    path('api/diagnosis/progress/', get_diagnostic_progress, name='get_diagnostic_progress'),
    path('api/diagnosis/report/<int:report_id>/', get_diagnostic_report, name='get_diagnostic_report'),
    path('api/diagnosis/comparison/', client_comparison, name='client_comparison'),
    path('api/diagnosis/defender/status/', defender_status_api, name='defender_status_api'),
    path('api/diagnosis/scenario/<int:scenario_id>/', run_diagnostic_scenario, name='run_diagnostic_scenario'),
    path('api/diagnosis/scenario/result/<int:run_id>/', get_scenario_result, name='get_scenario_result'),
    path('api/diagnosis/latest/', get_latest_diagnosis_result, name='get_latest_diagnosis_result'),
    path('api/diagnosis/<int:diagnosis_id>/file/<str:file_type>/', download_diagnostic_file, name='download_diagnostic_file'),
    path('system/updates-info/', system_updates_info, name='system_updates_info'),
    
    path('api/diagnosis/issue/<int:issue_id>/resolve/', mark_issue_resolved, name='mark_issue_resolved'),
    
    #Soluciones drivers
    path('api/diagnosis/fix-driver/<str:driver_id>/', fix_driver, name='fix_driver'),
    path('api/diagnosis/fix-all-drivers/', fix_all_drivers, name='fix_all_drivers'),
    path('api/diagnosis/scan-drivers/', scan_drivers, name='scan_drivers'),
    path('api/diagnosis/download-driver/<str:device_id>/', download_driver, name='download_driver'),
    path('api/system/restart/', restart_system, name='restart_system'),
    path('api/speech-to-text/', speech_to_text, name='speech_to_text'),
    
    #Carrito de compras
    path('products/', product_list, name='product_list'),
    path('products/create/', product_create, name='product_create'),
    path('products/<int:pk>/update/', product_update, name='product_update'),
    path('products/<int:pk>/delete/', product_delete, name='product_delete'),
    
    # Categorías
    path('categories/', category_list, name='category_list'),
    path('categories/create/', category_create, name='category_create'),
    path('categories/<int:pk>/update/', category_update, name='category_update'),
    path('categories/delete/<int:pk>/', category_delete, name='category_delete'),
    
    # Reporte de ventas
    path('sales/report/', sales_report, name='sales_report'),
    
    path('client/recommendations/api/', client_recommendations_api, name='client_recommendations_api'),
    path('client/cart/add/<int:producto_id>/', add_to_cart, name='add_to_cart'),
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
  re_path(r'^dashboard/media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)