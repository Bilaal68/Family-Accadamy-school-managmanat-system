from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


class CustomAccessToken(AccessToken):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token


class CustomRefreshToken(RefreshToken):
    access_token_class = CustomAccessToken

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token
