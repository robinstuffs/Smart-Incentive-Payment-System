from app import create_app, db
from app.models import SystemSetting

app = create_app()

with app.app_context():
    # Set default max applications per user
    max_apps = SystemSetting.query.filter_by(key="max_applications_per_user").first()
    if not max_apps:
        max_apps = SystemSetting(key="max_applications_per_user", value="3", description="Maximum number of applications a user can submit")
        db.session.add(max_apps)

    # Set default incentive amount
    incentive_amount = SystemSetting.query.filter_by(key="incentive_amount").first()
    if not incentive_amount:
        incentive_amount = SystemSetting(key="incentive_amount", value="100.00", description="Default incentive amount for eligible applicants")
        db.session.add(incentive_amount)

    # Enable/disable application period
    application_period_enabled = SystemSetting.query.filter_by(key="application_period_enabled").first()
    if not application_period_enabled:
        application_period_enabled = SystemSetting(key="application_period_enabled", value="True", description="Enable or disable the application submission period")
        db.session.add(application_period_enabled)

    db.session.commit()
    print("Default system settings initialized.")
