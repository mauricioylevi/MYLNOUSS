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

ActiveRecord::Schema[8.1].define(version: 2026_08_18_142600) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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

  create_table "daily_journals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date"
    t.jsonb "entries"
    t.bigint "main_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["main_user_id"], name: "index_daily_journals_on_main_user_id"
  end

  create_table "game_caches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "difficulty"
    t.string "game_type"
    t.bigint "main_user_id"
    t.jsonb "payload"
    t.datetime "updated_at", null: false
    t.index ["main_user_id", "game_type", "difficulty"], name: "index_game_caches_on_user_and_type_and_diff"
    t.index ["main_user_id"], name: "index_game_caches_on_main_user_id"
  end

  create_table "game_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "event_type"
    t.string "game_name"
    t.bigint "main_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["main_user_id"], name: "index_game_events_on_main_user_id"
  end

  create_table "guests", force: :cascade do |t|
    t.boolean "can_play_games", default: false
    t.boolean "can_post_photos", default: false
    t.boolean "can_read_journals", default: false
    t.datetime "created_at", null: false
    t.string "email"
    t.string "invitation_token"
    t.string "name"
    t.string "password_digest"
    t.boolean "registered", default: false
    t.datetime "updated_at", null: false
  end

  create_table "main_users", force: :cascade do |t|
    t.string "access_token"
    t.datetime "created_at", null: false
    t.jsonb "profile_data"
    t.datetime "updated_at", null: false
  end

  create_table "photos", force: :cascade do |t|
    t.string "author_type", default: "Admin"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "daily_journals", "main_users"
  add_foreign_key "game_caches", "main_users"
  add_foreign_key "game_events", "main_users"
end
