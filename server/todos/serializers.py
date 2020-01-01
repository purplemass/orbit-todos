from rest_framework import serializers

from .models import Todo


class TodoSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Todo
        fields = ['url', 'uuid', 'name', 'done', 'deleted', ]
