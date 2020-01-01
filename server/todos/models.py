import uuid

from django.db import models


class Todo(models.Model):
    uuid = models.CharField(
        max_length=100, blank=True, unique=True, default=uuid.uuid4)
    name = models.CharField(max_length=200)
    done = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.name
