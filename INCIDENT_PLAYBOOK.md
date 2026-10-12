# Incident response draft / 安全事件响应草案

Unreviewed procedure; an incident owner and legal contacts must be assigned before launch.
待审查流程；上线前必须指定事件负责人及法律联络人。

1. Contain / 隔离：pause affected endpoints or shut down the preview; retain real-data gates. Do not expose credentials, patient records or raw logs in chat, tickets or public pages.
2. Record / 记录：record UTC time, affected component, symptom and redacted event IDs in a restricted incident record. Preserve necessary evidence; do not destroy data or broadly export records.
3. Credentials / 凭据：for suspected credential exposure, revoke/rotate through the owning provider, update server configuration and restart. Check permissions and stop affected sessions. Credential entry remains the founder's action; never paste secrets into chat.
4. Assess / 评估：determine scope using minimum necessary metadata. Have qualified counsel determine notification duties and timing; do not invent a legal deadline. Notify affected parties only through an explicitly authorized process.
5. Recover / 恢复：fix the cause, repeat authorization/security tests and restore only from a reviewed encrypted backup. Test restore with synthetic records; maintain deletion tombstones so erased records are not silently resurrected.
6. Review / 复盘：document cause, controls changed, verified recovery and remaining limitations. Resume real-data operations only after their prerequisites and review are satisfied.

Devnet uncertainty / 开发网交易状态不明：do not automatically resend. Check the actual signature and cluster with the founder. Do not claim success from a wallet popup alone. Never request a seed phrase or private key; incident response does not authorize a fund transfer.

Current limitations / 当前限制：no public hosting, operator incident team, encrypted backup/restore drill or real-data notification process has been verified. Local sessions/rate limits reset on restart. No real journal data may be collected.
