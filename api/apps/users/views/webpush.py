import logging
from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from webpush.forms import SubscriptionForm, WebPushForm

logger = logging.getLogger("api")


def process_subscription_data(post_data):
    """Process the subscription data according to our model.
    Copiado de webpush.views para garantir compatibilidade.
    """
    subscription_data = post_data.get("subscription", {})
    # As our database saves the auth and p256dh key in separate field,
    # we need to refactor it and insert the auth and p256dh keys in the same dictionary
    keys = subscription_data.pop("keys", {})
    subscription_data.update(keys)
    # Insert the browser name and user agent
    subscription_data["browser"] = post_data.get("browser", "")[:100]
    subscription_data["user_agent"] = post_data.get("user_agent", "")
    return subscription_data


class WebPushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            post_data = request.data
            
            logger.info(
                f"Push subscribe request - {request.user.email}",
                extra={
                    "user": request.user.email,
                    "time": datetime.now(),
                }
            )
            # Process the subscription data to match with the model
            subscription_data = process_subscription_data(dict(post_data))
            subscription_form = SubscriptionForm(subscription_data)

            # pass the data through WebPushForm for validation purpose
            web_push_form = WebPushForm(post_data)

            if subscription_form.is_valid() and web_push_form.is_valid():
                web_push_data = web_push_form.cleaned_data
                status_type = web_push_data.pop("status_type")
                group_name = web_push_data.pop("group")

                # Save the subscription info
                subscription = subscription_form.get_or_save()
                web_push_form.save_or_delete(
                    subscription=subscription,
                    user=request.user,
                    status_type=status_type,
                    group_name=group_name,
                )

                return Response(
                    {"status": "success"},
                    status=201 if status_type == "subscribe" else 202,
                )

            errors = {
                "subscription_errors": subscription_form.errors,
                "web_push_errors": web_push_form.errors,
            }
            return Response(errors, status=400)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
