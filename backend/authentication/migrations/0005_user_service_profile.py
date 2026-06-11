# Generated for PANOPTES-X service profile support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_activationtoken_otp_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='service_profile',
            field=models.CharField(choices=[('business', 'Business'), ('family', 'Family'), ('partner', 'Partner')], default='business', max_length=10),
        ),
    ]

