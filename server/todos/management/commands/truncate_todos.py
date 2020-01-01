from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Truncates entries for the Todo model'
    table = 'todos_todo'

    def handle(self, *args, **options):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM '{}'".format(self.table))
        cursor.execute(
            "DELETE FROM SQLITE_SEQUENCE WHERE name='{}'".format(self.table))
        print('Todo entries truncated')
