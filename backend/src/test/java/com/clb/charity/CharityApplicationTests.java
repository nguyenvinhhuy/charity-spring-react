package com.clb.charity;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration test that boots the full application context against a real Postgres container.
 */
@SpringBootTest(properties =
        "app.jwt.secret=Y2xiLWNoYXJpdHktY29udGV4dGxvYWRzLXRlc3Qtc2VjcmV0LTAxMjM0NTY3ODktYWJjZGVm")
@Testcontainers
class CharityApplicationTests {

    // Real Postgres (not an embedded DB): the schema uses Postgres-specific text[] array columns.
    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    /**
     * Verifies that the context starts and every bean wires successfully.
     */
    @Test
    void contextLoads() {
        // Intentionally empty: a failed context startup fails this test.
    }
}
