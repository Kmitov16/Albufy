from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CustomTokenObtainView, LogoutView, ProfileView

urlpatterns = [
    path('signup/', RegisterView.as_view(), name='signup'),
    path('login/', CustomTokenObtainView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("profile/", ProfileView.as_view(), name="profile"),
]