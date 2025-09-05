-- Sample polls for testing
INSERT INTO polls (id, title, description, options, created_by, created_at, expires_at, is_active, allow_multiple_selections, require_login)
VALUES 
  (
    gen_random_uuid(),
    'What is your favorite programming language?',
    'Help us understand the community preferences for programming languages.',
    '["JavaScript", "Python", "TypeScript", "Go", "Rust"]',
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW() + INTERVAL '7 days',
    true,
    false,
    false
  ),
  (
    gen_random_uuid(),
    'Best time for team meetings?',
    'When should we schedule our weekly team meetings?',
    '["9:00 AM", "10:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]',
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW() + INTERVAL '3 days',
    true,
    false,
    false
  ),
  (
    gen_random_uuid(),
    'Preferred work environment?',
    'What type of work environment do you prefer?',
    '["Remote", "Office", "Hybrid", "Co-working space"]',
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    NOW() + INTERVAL '5 days',
    true,
    true,
    false
  );