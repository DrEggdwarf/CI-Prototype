# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_13_100002) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "attachments", force: :cascade do |t|
    t.integer "control_id", null: false
    t.datetime "created_at", null: false
    t.integer "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["control_id"], name: "index_attachments_on_control_id"
    t.index ["member_id"], name: "index_attachments_on_member_id"
  end

  create_table "comments", force: :cascade do |t|
    t.string "action_type", null: false
    t.text "ai_answer"
    t.text "ai_question"
    t.string "author", null: false
    t.text "body"
    t.integer "control_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["control_id"], name: "index_comments_on_control_id"
  end

  create_table "controls", force: :cascade do |t|
    t.integer "assignee_id"
    t.datetime "created_at", null: false
    t.string "criticality", null: false
    t.string "domain", null: false
    t.date "due_date", null: false
    t.integer "duration", default: 1, null: false
    t.string "frequency", null: false
    t.string "name", null: false
    t.integer "pass_rate", default: 0, null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_controls_on_assignee_id"
    t.index ["domain"], name: "index_controls_on_domain"
    t.index ["due_date"], name: "index_controls_on_due_date"
    t.index ["status"], name: "index_controls_on_status"
  end

  create_table "documents", force: :cascade do |t|
    t.integer "control_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "file_size"
    t.string "file_type"
    t.string "file_url"
    t.string "name", null: false
    t.boolean "shared", default: true
    t.datetime "updated_at", null: false
    t.integer "uploaded_by_id"
    t.index ["control_id"], name: "index_documents_on_control_id"
    t.index ["uploaded_by_id"], name: "index_documents_on_uploaded_by_id"
  end

  create_table "domains", force: :cascade do |t|
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_domains_on_key", unique: true
    t.index ["name"], name: "index_domains_on_name", unique: true
  end

  create_table "members", force: :cascade do |t|
    t.boolean "admin", default: false, null: false
    t.string "color", null: false
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "initials", null: false
    t.integer "load", default: 0, null: false
    t.string "name", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_members_on_email", unique: true
    t.index ["reset_password_token"], name: "index_members_on_reset_password_token", unique: true
  end

  create_table "news_items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.boolean "pinned", default: false
    t.datetime "published_at"
    t.string "source_name"
    t.string "source_url"
    t.text "summary"
    t.json "tags", default: []
    t.string "title", null: false
    t.datetime "updated_at", null: false
  end

  create_table "picks", force: :cascade do |t|
    t.integer "control_id", null: false
    t.datetime "created_at", null: false
    t.string "reason", null: false
    t.integer "score", null: false
    t.text "tags", default: "[]", null: false
    t.datetime "updated_at", null: false
    t.index ["control_id"], name: "index_picks_on_control_id", unique: true
  end

  create_table "signals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description", null: false
    t.string "icon", null: false
    t.string "severity", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
  end

  create_table "team_messages", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.integer "member_id", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_team_messages_on_member_id"
  end

  create_table "todos", force: :cascade do |t|
    t.boolean "completed", default: false, null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.integer "member_id", null: false
    t.integer "position", default: 0, null: false
    t.string "priority", default: "medium", null: false
    t.text "tags", default: "[]"
    t.datetime "updated_at", null: false
    t.index ["member_id"], name: "index_todos_on_member_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attachments", "controls"
  add_foreign_key "attachments", "members"
  add_foreign_key "comments", "controls"
  add_foreign_key "controls", "members", column: "assignee_id"
  add_foreign_key "documents", "controls"
  add_foreign_key "documents", "members", column: "uploaded_by_id"
  add_foreign_key "picks", "controls"
  add_foreign_key "team_messages", "members"
  add_foreign_key "todos", "members"
end
