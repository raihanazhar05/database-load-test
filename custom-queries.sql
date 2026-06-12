-- Example custom SQL queries for load testing
-- These queries will be executed randomly during the test

SELECT * FROM test_table WHERE status = 'active' ORDER BY created_at DESC

SELECT name, email, COUNT(*) as total FROM test_table GROUP BY name, email HAVING COUNT(*) > 1

SELECT * FROM test_table WHERE amount > 500 AND status = 'active' ORDER BY amount DESC LIMIT 10

UPDATE test_table SET status = 'processed' WHERE status = 'active' AND amount < 100

SELECT AVG(amount) as avg_amount, MIN(amount) as min_amount, MAX(amount) as max_amount FROM test_table
