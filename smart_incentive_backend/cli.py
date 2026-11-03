import click
from app import create_app, db
from app.models import User

app = create_app()

@app.cli.command("create-admin")
@click.argument("username")
@click.argument("email")
@click.argument("password")
def create_admin(username, email, password):
    "Creates a new admin user"
    with app.app_context():
        if User.query.filter_by(username=username).first():
            click.echo(f"Admin user {username} already exists.")
            return
        admin_user = User(username=username, email=email, role="admin")
        admin_user.set_password(password)
        db.session.add(admin_user)
        db.session.commit()
        click.echo(f"Admin user {username} created successfully.")

@app.cli.command("create-user")
@click.argument("username")
@click.argument("email")
@click.argument("password")
def create_user(username, email, password):
    "Creates a new regular user"
    with app.app_context():
        if User.query.filter_by(username=username).first():
            click.echo(f"User {username} already exists.")
            return
        new_user = User(username=username, email=email, role="user")
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        click.echo(f"User {username} created successfully.")
