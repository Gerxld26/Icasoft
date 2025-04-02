def user_role(request):
    """
    Context processor to add the user's role to all templates.
    """
    if request.user.is_authenticated:
        return {'user_role': request.user.role}
    return {}
