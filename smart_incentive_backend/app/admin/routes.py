from flask import jsonify, request
from app.admin import bp
from app.models import User, Application, Payment, SystemSetting, Bank
from app import db
from flask_jwt_extended import jwt_required
from app.decorators import admin_required
from sqlalchemy import func, extract
from app.ml_service import MLService

@bp.route("/dashboard", methods=["GET"])
@jwt_required()
@admin_required
def admin_dashboard():
    total_users = User.query.count()
    total_applications = Application.query.count()
    eligible_applications = Application.query.filter_by(ml_prediction="Eligible").count()
    non_eligible_applications = Application.query.filter_by(ml_prediction="Not Eligible").count()
    total_payments = Payment.query.count()
    total_incentive_amount = db.session.query(func.sum(Payment.amount)).scalar() or 0

    return jsonify({
        "total_users": total_users,
        "total_applications": total_applications,
        "eligible_applications": eligible_applications,
        "non_eligible_applications": non_eligible_applications,
        "total_payments": total_payments,
        "total_incentive_amount": total_incentive_amount
    }), 200

# ── Bank Management ──────────────────────────────────────────────────────────

@bp.route("/banks", methods=["GET"])
@jwt_required()
@admin_required
def get_banks():
    banks = Bank.query.order_by(Bank.name).all()
    return jsonify([{
        "id": b.id,
        "name": b.name,
        "abbreviation": b.abbreviation,
        "created_at": b.created_at.isoformat(),
        "updated_at": b.updated_at.isoformat(),
    } for b in banks]), 200

@bp.route("/banks", methods=["POST"])
@jwt_required()
@admin_required
def create_bank():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    abbreviation = (data.get("abbreviation") or "").strip()

    if not name:
        return jsonify({"message": "Bank name is required"}), 400
    if not abbreviation:
        return jsonify({"message": "Bank abbreviation is required"}), 400
    if Bank.query.filter_by(name=name).first():
        return jsonify({"message": "A bank with this name already exists"}), 409

    bank = Bank(name=name, abbreviation=abbreviation.upper())
    db.session.add(bank)
    db.session.commit()
    return jsonify({"message": "Bank created successfully", "id": bank.id, "name": bank.name, "abbreviation": bank.abbreviation}), 201

@bp.route("/banks/<int:bank_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_bank(bank_id):
    bank = Bank.query.get(bank_id)
    if not bank:
        return jsonify({"message": "Bank not found"}), 404

    data = request.get_json()
    name = (data.get("name") or "").strip()
    abbreviation = (data.get("abbreviation") or "").strip()

    if not name:
        return jsonify({"message": "Bank name is required"}), 400
    if not abbreviation:
        return jsonify({"message": "Bank abbreviation is required"}), 400

    existing = Bank.query.filter_by(name=name).first()
    if existing and existing.id != bank_id:
        return jsonify({"message": "A bank with this name already exists"}), 409

    bank.name = name
    bank.abbreviation = abbreviation.upper()
    db.session.commit()
    return jsonify({"message": "Bank updated successfully", "id": bank.id, "name": bank.name, "abbreviation": bank.abbreviation}), 200

@bp.route("/banks/<int:bank_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_bank(bank_id):
    bank = Bank.query.get(bank_id)
    if not bank:
        return jsonify({"message": "Bank not found"}), 404

    # Check if any user is linked to this bank
    if User.query.filter_by(bank_id=bank_id).count() > 0:
        return jsonify({"message": "Cannot delete bank: users have this bank set as their payment bank"}), 409

    db.session.delete(bank)
    db.session.commit()
    return jsonify({"message": "Bank deleted successfully"}), 200

# ── User Management ──────────────────────────────────────────────────────────

@bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def manage_users():
    users = User.query.all()
    users_data = []
    for user in users:
        bank_info = None
        if user.bank:
            bank_info = {"id": user.bank.id, "name": user.bank.name, "abbreviation": user.bank.abbreviation}
        users_data.append({
            "id": user.id,
            "surname": user.surname,
            "firstname": user.firstname,
            "middlename": user.middlename,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_blocked": user.is_blocked,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "phone_number": user.phone_number,
            "street_address": user.street_address,
            "area_district": user.area_district,
            "city": user.city,
            "lga": user.lga,
            "state": user.state,
            "country": user.country,
            "postal_code": user.postal_code,
            "account_name": user.account_name,
            "account_number": user.account_number,
            "bank_id": user.bank_id,
            "bank": bank_info,
            "is_profile_complete": user.is_profile_complete(),
        })
    return jsonify(users_data), 200

@bp.route("/users/<int:user_id>/block", methods=["PUT"])
@jwt_required()
@admin_required
def block_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    user.is_blocked = True
    db.session.commit()
    return jsonify({"message": f"User {user.username} blocked successfully"}), 200

@bp.route("/users/<int:user_id>/unblock", methods=["PUT"])
@jwt_required()
@admin_required
def unblock_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    user.is_blocked = False
    db.session.commit()
    return jsonify({"message": f"User {user.username} unblocked successfully"}), 200

@bp.route("/applications", methods=["GET"])
@jwt_required()
@admin_required
def manage_applications():
    status_filter = request.args.get("status")
    ml_prediction_filter = request.args.get("ml_prediction")

    query = Application.query

    if status_filter:
        query = query.filter_by(status=status_filter)
    if ml_prediction_filter:
        if ml_prediction_filter.lower() == "eligible":
            query = query.filter_by(ml_prediction="Eligible")
        elif ml_prediction_filter.lower() == "not_eligible":
            query = query.filter_by(ml_prediction="Not Eligible")

    applications = query.all()
    applications_data = []
    for app in applications:
        user = app.applicant
        bank_info = None
        if user and user.bank:
            bank_info = {"id": user.bank.id, "name": user.bank.name, "abbreviation": user.bank.abbreviation}
        applications_data.append({
            "id": app.id,
            "user_id": app.user_id,
            "username": app.applicant.username if app.applicant else None,
            "age": app.age,
            "income": app.income,
            "employment_status": app.employment_status,
            "housing_status": app.housing_status,
            "health_status": app.health_status,
            "disability": app.disability,
            "chronic_illness": app.chronic_illness,
            "caregiver": app.caregiver,
            "family_support": app.family_support,
            "healthcare_access": app.healthcare_access,
            "national_id": app.national_id,
            "location": app.location,
            "submission_date": app.submission_date.isoformat(),
            "status": app.status,
            "ml_prediction": app.ml_prediction,
            "ml_probability": app.ml_probability,
            "ml_confidence": app.ml_confidence,
            "admin_notes": app.admin_notes,
            # user payment details
            "account_name": user.account_name if user else None,
            "account_number": user.account_number if user else None,
            "bank": bank_info,
        })
    return jsonify(applications_data), 200

@bp.route("/applications/<int:application_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def update_application_status(application_id):
    application = Application.query.get(application_id)
    if not application:
        return jsonify({"message": "Application not found"}), 404
    data = request.get_json()
    new_status = data.get("status")
    admin_notes = data.get("admin_notes")

    if new_status:
        application.status = new_status
    if admin_notes:
        application.admin_notes = admin_notes
    db.session.commit()
    return jsonify({"message": "Application status updated successfully"}), 200

@bp.route("/settings", methods=["GET"])
@jwt_required()
@admin_required
def get_system_settings():
    settings = SystemSetting.query.all()
    settings_data = {}
    for setting in settings:
        settings_data[setting.key] = setting.value
    return jsonify(settings_data), 200

@bp.route("/settings", methods=["POST"])
@jwt_required()
@admin_required
def update_system_settings():
    data = request.get_json()
    for key, value in data.items():
        setting = SystemSetting.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            new_setting = SystemSetting(key=key, value=value)
            db.session.add(new_setting)
    db.session.commit()
    return jsonify({"message": "System settings updated successfully"}), 200

@bp.route("/payments", methods=["GET"])
@jwt_required()
@admin_required
def monitor_payments():
    payments = Payment.query.all()
    payments_data = []
    for payment in payments:
        app = payment.application
        user = app.applicant if app else None
        payments_data.append({
            "id": payment.id,
            "application_id": payment.application_id,
            "transaction_id": payment.transaction_id,
            "amount": payment.amount,
            "payment_date": payment.payment_date,
            "status": payment.status,
            "account_name": payment.account_name,
            "account_number": payment.account_number,
            "bank_name": payment.bank_name,
            "bank_abbreviation": payment.bank_abbreviation,
            "user_id": user.id if user else None,
            "username": user.username if user else None,
        })
    return jsonify(payments_data), 200

@bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
@admin_required
def edit_user_details(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    user.username = data.get("username", user.username)
    user.email = data.get("email", user.email)
    user.role = data.get("role", user.role)
    user.is_blocked = data.get("is_blocked", user.is_blocked)

    new_password = data.get("password")
    if new_password:
        user.set_password(new_password)

    db.session.commit()
    return jsonify({"message": f"User {user.username} details updated successfully"}), 200

@bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    try:
        user_applications = Application.query.filter_by(user_id=user_id).all()
        for app in user_applications:
            Payment.query.filter_by(application_id=app.id).delete()
        Application.query.filter_by(user_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": f"User {user.username} and all associated data deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting user: {str(e)}"}), 500

@bp.route("/ml-interpretability", methods=["GET"])
@jwt_required()
@admin_required
def get_ml_interpretability():
    feature_importances = MLService.get_feature_importances()
    return jsonify(feature_importances), 200

@bp.route("/payments/duplicates", methods=["GET"])
@jwt_required()
@admin_required
def detect_duplicate_payments():
    duplicate_applications = db.session.query(Payment.application_id, func.count(Payment.id)).\
        group_by(Payment.application_id).\
        having(func.count(Payment.id) > 1).all()

    duplicate_payments_data = []
    for app_id, count in duplicate_applications:
        payments = Payment.query.filter_by(application_id=app_id).all()
        payment_details = []
        for payment in payments:
            payment_details.append({
                "id": payment.id,
                "transaction_id": payment.transaction_id,
                "amount": payment.amount,
                "payment_date": payment.payment_date,
                "status": payment.status,
            })
        duplicate_payments_data.append({
            "application_id": app_id,
            "payment_count": count,
            "payments": payment_details
        })

    return jsonify(duplicate_payments_data), 200


# ═══════════════════════════════════════════════════════════════════
# REPORTS & SPREADSHEET GENERATION  ── added block
# ═══════════════════════════════════════════════════════════════════
# Prerequisites (add to top of file):
#   from flask import send_file
#   import io, calendar
#   from datetime import datetime
#   import openpyxl
#   from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
#   from openpyxl.utils import get_column_letter
# Run: pip install openpyxl
# ═══════════════════════════════════════════════════════════════════

import io
import calendar
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from flask import send_file


def _style_header_row(ws, row_num, fill_color="1e3a5f"):
    header_fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(left=Side(style="thin"), right=Side(style="thin"),
                         top=Side(style="thin"), bottom=Side(style="thin"))
    for cell in ws[row_num]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
        cell.border = thin_border


def _auto_fit_columns(ws, min_width=12, max_width=40):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                if cell.value:
                    max_len = max(max_len, len(str(cell.value)))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max(max_len + 2, min_width), max_width)


def _add_row_borders(ws, start_row, end_row):
    thin_border = Border(left=Side(style="thin"), right=Side(style="thin"),
                         top=Side(style="thin"), bottom=Side(style="thin"))
    alt_fill = PatternFill(start_color="EBF5FB", end_color="EBF5FB", fill_type="solid")
    for i, row in enumerate(ws.iter_rows(min_row=start_row, max_row=end_row)):
        for cell in row:
            cell.border = thin_border
            if i % 2 == 1:
                cell.fill = alt_fill


# ── 1. Report Meta ───────────────────────────────────────────────

@bp.route("/reports/meta", methods=["GET"])
@jwt_required()
@admin_required
def report_meta():
    earliest = db.session.query(func.min(Payment.payment_date)).scalar()
    latest = db.session.query(func.max(Payment.payment_date)).scalar()
    return jsonify({
        "earliest_year": earliest.year if earliest else datetime.utcnow().year,
        "latest_year": latest.year if latest else datetime.utcnow().year,
        "total_participants": User.query.filter(User.role == "user").count(),
        "total_payments": Payment.query.count(),
        "total_disbursed": round(db.session.query(func.sum(Payment.amount)).scalar() or 0, 2),
    }), 200


# ── 2. Monthly Eligible Participants ────────────────────────────

@bp.route("/reports/eligible-participants", methods=["GET"])
@jwt_required()
@admin_required
def report_eligible_participants():
    year = request.args.get("year", datetime.utcnow().year, type=int)
    month = request.args.get("month", datetime.utcnow().month, type=int)

    payments = (
        db.session.query(Payment)
        .join(Application, Payment.application_id == Application.id)
        .join(User, Application.user_id == User.id)
        .filter(
            Application.status == "approved",
            extract("year", Payment.payment_date) == year,
            extract("month", Payment.payment_date) == month,
        ).all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    month_name = calendar.month_name[month]
    ws.title = f"{month_name[:8]} {year}"

    ws.merge_cells("A1:H1")
    t = ws["A1"]
    t.value = f"Eligible Participants Report – {month_name} {year}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["Full Name", "Transaction ID", "Bank Account No.", "Bank Name",
               "State", "LGA / Constituency", "City / Town", "Age"])
    _style_header_row(ws, 2)

    for payment in payments:
        app = payment.application
        user = app.applicant if app else None
        if not user:
            continue
        full_name = f"{user.surname} {user.firstname}" + (f" {user.middlename}" if user.middlename else "")
        ws.append([full_name.strip(), payment.transaction_id,
                   payment.account_number or user.account_number or "—",
                   payment.bank_name or "—", user.state or "—", user.lga or "—",
                   user.city or user.area_district or "—", app.age if app else "—"])

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"eligible_participants_{year}_{month:02d}.xlsx")


# ── 3. Monthly Expenditure by LGA ───────────────────────────────

@bp.route("/reports/monthly-expenditure", methods=["GET"])
@jwt_required()
@admin_required
def report_monthly_expenditure():
    year = request.args.get("year", datetime.utcnow().year, type=int)
    month = request.args.get("month", datetime.utcnow().month, type=int)

    rows = (
        db.session.query(User.state, User.lga,
                         func.count(Payment.id).label("payments"),
                         func.sum(Payment.amount).label("total_amount"))
        .join(Application, Application.user_id == User.id)
        .join(Payment, Payment.application_id == Application.id)
        .filter(extract("year", Payment.payment_date) == year,
                extract("month", Payment.payment_date) == month,
                Application.status == "approved")
        .group_by(User.state, User.lga)
        .order_by(User.state, User.lga).all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    month_name = calendar.month_name[month]
    ws.title = f"Exp {month_name[:3]} {year}"

    ws.merge_cells("A1:E1")
    t = ws["A1"]
    t.value = f"Monthly Expenditure by LGA – {month_name} {year}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["State", "LGA", "No. of Beneficiaries", "Total Amount (₦)", "% of Total"])
    _style_header_row(ws, 2)

    grand_total = sum(r.total_amount or 0 for r in rows)
    for row in rows:
        pct = (row.total_amount / grand_total * 100) if grand_total else 0
        ws.append([row.state or "—", row.lga or "—", row.payments,
                   round(row.total_amount or 0, 2), f"{pct:.1f}%"])

    tr = ws.max_row + 1
    for col, val in [(1, "TOTAL"), (3, sum(r.payments for r in rows)),
                     (4, round(grand_total, 2)), (5, "100%")]:
        c = ws.cell(tr, col, val)
        c.font = Font(bold=True)
        c.fill = PatternFill(start_color="D5EAF5", end_color="D5EAF5", fill_type="solid")

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)
    for row in ws.iter_rows(min_row=3, max_row=ws.max_row, min_col=4, max_col=4):
        for cell in row:
            cell.number_format = '#,##0.00'
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"monthly_expenditure_{year}_{month:02d}.xlsx")


# ── 4. Yearly Expenditure (multi-sheet) ─────────────────────────

@bp.route("/reports/yearly-expenditure", methods=["GET"])
@jwt_required()
@admin_required
def report_yearly_expenditure():
    year = request.args.get("year", datetime.utcnow().year, type=int)

    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    ws_sum = wb.create_sheet("Annual Summary")
    ws_sum.merge_cells("A1:E1")
    t = ws_sum["A1"]
    t.value = f"Annual Expenditure Summary – {year}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws_sum.row_dimensions[1].height = 30
    ws_sum.append(["State", "LGA", "Total Beneficiaries", "Total Amount (₦)", "Months Active"])
    _style_header_row(ws_sum, 2)

    annual_rows = (
        db.session.query(User.state, User.lga,
                         func.count(Payment.id).label("payments"),
                         func.sum(Payment.amount).label("total_amount"),
                         func.count(func.distinct(extract("month", Payment.payment_date))).label("months"))
        .join(Application, Application.user_id == User.id)
        .join(Payment, Payment.application_id == Application.id)
        .filter(extract("year", Payment.payment_date) == year, Application.status == "approved")
        .group_by(User.state, User.lga).order_by(User.state, User.lga).all()
    )
    for row in annual_rows:
        ws_sum.append([row.state or "—", row.lga or "—", row.payments,
                        round(row.total_amount or 0, 2), row.months])
    _add_row_borders(ws_sum, 3, ws_sum.max_row)
    _auto_fit_columns(ws_sum)

    for m in range(1, 13):
        mname = calendar.month_name[m]
        ws = wb.create_sheet(mname[:3])
        ws.merge_cells("A1:E1")
        t = ws["A1"]
        t.value = f"{mname} {year} – Expenditure by LGA"
        t.font = Font(bold=True, size=13, color="1e3a5f")
        t.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[1].height = 26
        ws.append(["State", "LGA", "Beneficiaries", "Amount (₦)", "% of Month"])
        _style_header_row(ws, 2)

        m_rows = (
            db.session.query(User.state, User.lga,
                             func.count(Payment.id).label("payments"),
                             func.sum(Payment.amount).label("total_amount"))
            .join(Application, Application.user_id == User.id)
            .join(Payment, Payment.application_id == Application.id)
            .filter(extract("year", Payment.payment_date) == year,
                    extract("month", Payment.payment_date) == m,
                    Application.status == "approved")
            .group_by(User.state, User.lga).order_by(User.state, User.lga).all()
        )

        mt = sum(r.total_amount or 0 for r in m_rows)
        if not m_rows:
            ws.append(["No data for this month", "", "", "", ""])
        else:
            for r in m_rows:
                pct = (r.total_amount / mt * 100) if mt else 0
                ws.append([r.state or "—", r.lga or "—", r.payments,
                            round(r.total_amount or 0, 2), f"{pct:.1f}%"])
            _add_row_borders(ws, 3, ws.max_row)
        _auto_fit_columns(ws)

    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"yearly_expenditure_{year}.xlsx")


# ── 5. Participants Master List ──────────────────────────────────

@bp.route("/reports/participants-master", methods=["GET"])
@jwt_required()
@admin_required
def report_participants_master():
    users = (User.query.filter(User.role == "user")
             .order_by(User.state, User.lga, User.surname).all())

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Master List"

    ws.merge_cells("A1:M1")
    t = ws["A1"]
    t.value = f"Participants Master List – Generated {datetime.utcnow().strftime('%d %B %Y')}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["S/N", "Surname", "First Name", "Middle Name", "Username",
               "Email", "Phone", "State", "LGA", "City/Town",
               "Account Number", "Bank", "Registration Date"])
    _style_header_row(ws, 2)

    for i, user in enumerate(users, 1):
        ws.append([i, user.surname or "—", user.firstname or "—", user.middlename or "—",
                   user.username, user.email, user.phone_number or "—",
                   user.state or "—", user.lga or "—",
                   user.city or user.area_district or "—",
                   user.account_number or "—",
                   user.bank.name if user.bank else "—",
                   user.created_at.strftime("%Y-%m-%d") if user.created_at else "—"])

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"participants_master_{datetime.utcnow().strftime('%Y%m%d')}.xlsx")


# ── 6. Application Status Summary ───────────────────────────────

@bp.route("/reports/application-summary", methods=["GET"])
@jwt_required()
@admin_required
def report_application_summary():
    year = request.args.get("year", type=int)

    q = (db.session.query(User.state, User.lga, Application.status,
                          func.count(Application.id).label("count"))
         .join(User, Application.user_id == User.id))
    if year:
        q = q.filter(extract("year", Application.submission_date) == year)
    rows = q.group_by(User.state, User.lga, Application.status).order_by(User.state, User.lga).all()

    pivot = {}
    for row in rows:
        key = (row.state or "Unknown", row.lga or "Unknown")
        if key not in pivot:
            pivot[key] = {"pending": 0, "approved": 0, "rejected": 0}
        if row.status in pivot[key]:
            pivot[key][row.status] = row.count

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "App Summary"
    year_label = str(year) if year else "All Time"

    ws.merge_cells("A1:F1")
    t = ws["A1"]
    t.value = f"Application Status Summary – {year_label}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["State", "LGA", "Pending", "Approved", "Rejected", "Total"])
    _style_header_row(ws, 2)

    for (state, lga), counts in sorted(pivot.items()):
        total = counts["pending"] + counts["approved"] + counts["rejected"]
        ws.append([state, lga, counts["pending"], counts["approved"], counts["rejected"], total])

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)

    gfill = PatternFill(start_color="C8E6C9", end_color="C8E6C9", fill_type="solid")
    rfill = PatternFill(start_color="FFCDD2", end_color="FFCDD2", fill_type="solid")
    yfill = PatternFill(start_color="FFF9C4", end_color="FFF9C4", fill_type="solid")
    for row in ws.iter_rows(min_row=3, max_row=ws.max_row):
        row[2].fill = yfill
        row[3].fill = gfill
        row[4].fill = rfill

    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    suffix = f"_{year}" if year else ""
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"application_summary{suffix}.xlsx")


# ── 7. Bank Distribution Report ─────────────────────────────────

@bp.route("/reports/bank-distribution", methods=["GET"])
@jwt_required()
@admin_required
def report_bank_distribution():
    rows = (
        db.session.query(Bank.name, Bank.abbreviation,
                         func.count(User.id).label("user_count"),
                         func.coalesce(func.sum(Payment.amount), 0).label("total_disbursed"))
        .outerjoin(User, User.bank_id == Bank.id)
        .outerjoin(Application, Application.user_id == User.id)
        .outerjoin(Payment, Payment.application_id == Application.id)
        .group_by(Bank.id, Bank.name, Bank.abbreviation)
        .order_by(func.count(User.id).desc()).all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Bank Distribution"

    ws.merge_cells("A1:D1")
    t = ws["A1"]
    t.value = f"Bank Distribution Report – {datetime.utcnow().strftime('%d %B %Y')}"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["Bank Name", "Abbreviation", "No. of Participants", "Total Disbursed (₦)"])
    _style_header_row(ws, 2)

    for row in rows:
        ws.append([row.name, row.abbreviation, row.user_count, round(row.total_disbursed, 2)])

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"bank_distribution_{datetime.utcnow().strftime('%Y%m%d')}.xlsx")


# ── 8. Age Demographics ─────────────────────────────────────────

@bp.route("/reports/age-demographics", methods=["GET"])
@jwt_required()
@admin_required
def report_age_demographics():
    apps = (db.session.query(Application, User)
            .join(User, Application.user_id == User.id)
            .order_by(User.state, Application.age).all())

    def bracket(age):
        if age < 60: return "Under 60"
        if age < 65: return "60–64"
        if age < 70: return "65–69"
        if age < 75: return "70–74"
        if age < 80: return "75–79"
        return "80+"

    pivot = {}
    for app, user in apps:
        key = (user.state or "Unknown", bracket(app.age))
        if key not in pivot:
            pivot[key] = {"approved": 0, "rejected": 0, "pending": 0}
        pivot[key][app.status if app.status in pivot[key] else "pending"] += 1

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Age Demographics"

    ws.merge_cells("A1:F1")
    t = ws["A1"]
    t.value = "Age Demographics Report"
    t.font = Font(bold=True, size=14, color="1e3a5f")
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.append(["State", "Age Bracket", "Approved", "Rejected", "Pending", "Total"])
    _style_header_row(ws, 2)

    for (state, brkt), counts in sorted(pivot.items()):
        total = counts["approved"] + counts["rejected"] + counts["pending"]
        ws.append([state, brkt, counts["approved"], counts["rejected"], counts["pending"], total])

    _add_row_borders(ws, 3, ws.max_row)
    _auto_fit_columns(ws)
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"age_demographics_{datetime.utcnow().strftime('%Y%m%d')}.xlsx")