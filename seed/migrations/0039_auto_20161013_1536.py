# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-10-13 22:36
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('seed', '0038_auto_20161008_2244'),
    ]

    operations = [
        migrations.AlterField(
            model_name='propertyauditlog',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='propertyauditlog__state', to='seed.PropertyState', unique=True),
        ),
        migrations.AlterField(
            model_name='taxlotauditlog',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='taxlotauditlog__state', to='seed.TaxLotState', unique=True),
        ),
    ]
