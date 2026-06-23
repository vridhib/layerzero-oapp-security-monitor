from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from monitor.models import BridgeContract, MonitoredOApp


class UserMonitorAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="adminpassword")
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.contract = BridgeContract.objects.create(
            address="0x85d456b2dff1fd8245387c0bfb64dfb700e98ef3",
            chain="ethereum",
            name="KelpDAO"    
        )

    def test_add_oapp_to_monitor(self):
        url = reverse("monitored-oapps-list") 
        data = {
            "address": self.contract.address,
            "chain": self.contract.chain,
            "name": self.contract.name
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contract = BridgeContract.objects.get(address=data['address'].lower())
        self.assertTrue(MonitoredOApp.objects.filter(user=self.user, contract=self.contract).exists())

    def test_get_monitored_oapps(self):
        MonitoredOApp.objects.create(user=self.user, contract=self.contract)
        url = reverse("monitored-oapps-list")
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]["id"], self.contract.id)


class AlertChannelAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="adminpassword")
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.login(username="testuser", password="testpass")

    def test_create_discord_webhook_channel(self):
        url = reverse("alert-channels-list")
        data = {
            "channel_type": "discord",
            "identifier": "https://discord.com/api/webhooks/123/abc"
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['channel_type'], "discord")