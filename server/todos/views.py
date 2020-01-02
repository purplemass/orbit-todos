from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.response import Response

from .models import Todo
from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows todos to be viewed or edited.
    """
    resource_name = 'todos'
    queryset = Todo.objects.all().order_by('-id')
    serializer_class = TodoSerializer


class TodoUuidViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows todos to be listed or edited by UUID.
    """
    resource_name = 'todos'
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    def list(self, request, uuid):
        queryset = Todo.objects.all()
        todo = get_object_or_404(queryset, uuid=uuid)
        serializer = TodoSerializer(todo, context={'request': request})
        return Response(serializer.data)
