# Staging Overlap Remediation - 2026-03-31

- Generated at: 2026-03-31T15:11:47.764Z
- Duplicate slot clusters: 38
- Pair conflicts: 70

## Recommended Cleanup Rule

For each exact same-slot duplicate cluster:
- keep the earliest created appointment as the survivor candidate
- cancel, archive, or delete the remaining duplicate rows
- record what changed in an audit log or manual remediation note

## Clusters

### Cluster 1

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-30T08:00:00.000Z -> 2025-12-30T09:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 50be2857-52d6-40b0-9902-ab31a7cabde5 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4
- remove_candidate: a63c68d5-3933-4508-8a68-34c0dd9bf5ef | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4

### Cluster 2

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-30T09:00:00.000Z -> 2025-12-30T10:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 0d29ae35-5837-4d34-a059-1d530b161d34 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=a66e0ec6-2f3f-4adc-9dce-bbf081ff476a
- remove_candidate: d2b45eea-8d27-4ed4-b5ea-8bdb8d0cb764 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=a66e0ec6-2f3f-4adc-9dce-bbf081ff476a

### Cluster 3

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-30T13:00:00.000Z -> 2025-12-30T14:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 8a0d501a-e229-4786-964d-b06e84cafc4f | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c
- remove_candidate: 8ac41e63-9e28-44ee-aaef-0211548153e3 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c

### Cluster 4

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-30T14:00:00.000Z -> 2025-12-30T15:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 29de937a-cd7e-4f12-8375-aeb007381e46 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b
- remove_candidate: 8459ab3f-cc31-4e8b-87e7-9decd9651c48 | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b

### Cluster 5

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-31T08:00:00.000Z -> 2025-12-31T09:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: d993a635-329a-4c66-b1aa-29c557daab4e | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b5154cf3-3ecb-4b33-8871-c0690d36bebb
- remove_candidate: b6470a5e-7004-4147-9d3d-a30edc46940e | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b5154cf3-3ecb-4b33-8871-c0690d36bebb
- remove_candidate: 1038380a-4389-4781-a9d5-0fb685b817b9 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4

### Cluster 6

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-31T10:00:00.000Z -> 2025-12-31T11:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: c376d88c-39e1-47d3-ad4f-c7794556fabc | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=ee2fe34a-fb61-4a72-9d85-b9b20329697f
- remove_candidate: 2c92f82c-577e-43a2-b518-dd1472356bb2 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=ee2fe34a-fb61-4a72-9d85-b9b20329697f

### Cluster 7

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-31T13:00:00.000Z -> 2025-12-31T14:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 0430e631-9891-4b44-bfab-0f67ad6a32e0 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=fe6b5f05-a979-46d3-b90a-9d960fbca1db
- remove_candidate: 3d217ebc-6089-4f0e-8b30-4d4f25d326ef | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=fe6b5f05-a979-46d3-b90a-9d960fbca1db
- remove_candidate: b6f4ce19-756a-487e-8699-7d5f76ba93fe | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c

### Cluster 8

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2025-12-31T14:00:00.000Z -> 2025-12-31T15:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 3fd6488e-6eec-4dc8-a506-2604707389bb | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b428b825-a6bc-4ab5-8738-3fd0691273c3
- remove_candidate: 4e7ff6cd-fb28-4c4e-9d07-43fda95deaec | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b428b825-a6bc-4ab5-8738-3fd0691273c3
- remove_candidate: e5f6cfe6-5336-427b-a3d1-3e275d2b48a1 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b

### Cluster 9

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-01T09:00:00.000Z -> 2026-01-01T10:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 4a7d0b02-c9dc-4ae9-8622-5ebb49d58215 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=c8eb193d-b37c-4e3e-b04a-4b14ef408efd
- remove_candidate: 7499f1d9-a67e-4133-83fd-dc127686125b | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=c8eb193d-b37c-4e3e-b04a-4b14ef408efd

### Cluster 10

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-01T10:00:00.000Z -> 2026-01-01T11:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 583c6af8-b4f9-405d-b99f-8f7a67fa8807 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=1430cb93-4233-448e-9527-d41c6735bb13
- remove_candidate: 3b5bf47d-946c-4605-b860-19409545178c | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=1430cb93-4233-448e-9527-d41c6735bb13
- remove_candidate: 77d7d578-cdcf-4de6-8f8e-070d5822ec57 | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=ee2fe34a-fb61-4a72-9d85-b9b20329697f

### Cluster 11

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-01T13:00:00.000Z -> 2026-01-01T14:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: c1bba318-f844-49d1-91f6-d8a03e5f293c | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=cd6e5f96-c375-46f3-b72f-67e0d81d95a9
- remove_candidate: 806c8f4b-56ce-46e5-915a-10eb729da91c | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=cd6e5f96-c375-46f3-b72f-67e0d81d95a9
- remove_candidate: 5ae75436-8b32-45bb-9e94-3d0f757930f7 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=fe6b5f05-a979-46d3-b90a-9d960fbca1db

### Cluster 12

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-02T08:00:00.000Z -> 2026-01-02T09:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 4f177354-084e-4ea4-827d-797e73c3e790 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=0ebbb5ae-6e3e-4cbe-8fa4-e210057806f2
- remove_candidate: 1a5ef73f-dcb4-49c8-a9c3-9c6a10a76640 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=0ebbb5ae-6e3e-4cbe-8fa4-e210057806f2

### Cluster 13

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-02T09:00:00.000Z -> 2026-01-02T10:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 2f64f861-75ce-475a-b091-a20cb5e12527 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=933fc5e0-d0e6-4f83-93bd-22f547583103
- remove_candidate: 060e4b36-65ec-437c-8984-2a56a28b2135 | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=933fc5e0-d0e6-4f83-93bd-22f547583103
- remove_candidate: bf594b44-38f6-4a0c-a42c-d231bf102d69 | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=c8eb193d-b37c-4e3e-b04a-4b14ef408efd

### Cluster 14

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-02T10:00:00.000Z -> 2026-01-02T11:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: b792bcbb-ab8a-414f-867d-b5f4115a7326 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=66aa62a9-b973-44bd-b1b1-f2a798b373bb
- remove_candidate: 7cfaa4da-2926-41c4-8671-28f166a57ab0 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=66aa62a9-b973-44bd-b1b1-f2a798b373bb
- remove_candidate: a0a4c7ca-dbfa-4b7e-9ae1-8e53a4bf220f | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=1430cb93-4233-448e-9527-d41c6735bb13

### Cluster 15

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-02T14:00:00.000Z -> 2026-01-02T15:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: e6cd86f7-6475-4529-8e12-89d9c2aa91e4 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=6d8b9072-83ca-4f1e-bb41-dd5a246218a8
- remove_candidate: c8fdb665-d409-474f-8a14-dd71ffecd608 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=6d8b9072-83ca-4f1e-bb41-dd5a246218a8

### Cluster 16

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-05T08:00:00.000Z -> 2026-01-05T09:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: d6a02842-688b-424d-9ae4-1da7e2f503ae | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=d3c85b31-a61c-40c2-b9e0-83e995f4ee19
- remove_candidate: 4977c911-25b1-488f-ac58-2ae534e41e6d | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=d3c85b31-a61c-40c2-b9e0-83e995f4ee19
- remove_candidate: 6dae5d21-ba71-442a-b13b-d7c46d3b8620 | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=0ebbb5ae-6e3e-4cbe-8fa4-e210057806f2

### Cluster 17

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-05T09:00:00.000Z -> 2026-01-05T10:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 2ba044a8-78f0-4452-984d-0054c71fcfb4 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b224656c-f946-4557-ba36-b68a6e3b8ead
- remove_candidate: 5ad430bd-38fb-40df-b6e7-6de22df6da7b | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b224656c-f946-4557-ba36-b68a6e3b8ead
- remove_candidate: d0ff653c-7e83-427e-96fc-cd076774a7d4 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=933fc5e0-d0e6-4f83-93bd-22f547583103

### Cluster 18

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-05T13:00:00.000Z -> 2026-01-05T14:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 4a83f81b-5f17-421d-a49d-084f2cf67476 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=bf996d87-73a2-4ed5-a2df-a09fcb3c6d25
- remove_candidate: 84de83f4-4688-4848-8b29-6a1ae8f87767 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=bf996d87-73a2-4ed5-a2df-a09fcb3c6d25

### Cluster 19

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-05T14:00:00.000Z -> 2026-01-05T15:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 069f8579-7be1-4246-a7eb-1afeee1dd7f8 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4
- remove_candidate: d6dfb602-8652-43d9-8042-f87b1409ddce | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4
- remove_candidate: 45d131df-6f97-4be5-b463-b0f80b177f41 | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=6d8b9072-83ca-4f1e-bb41-dd5a246218a8

### Cluster 20

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-06T08:00:00.000Z -> 2026-01-06T09:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 55f98075-12c8-4058-99b5-a09d351aa58f | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=a66e0ec6-2f3f-4adc-9dce-bbf081ff476a
- remove_candidate: 92f4ba9e-8a7d-40ba-a88d-699bf636b7c8 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=a66e0ec6-2f3f-4adc-9dce-bbf081ff476a
- remove_candidate: b8516ea9-ff5a-4934-9016-5ab047885be0 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=d3c85b31-a61c-40c2-b9e0-83e995f4ee19

### Cluster 21

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-06T10:00:00.000Z -> 2026-01-06T11:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 7613befd-1baf-431e-839f-7d5438244dc0 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c
- remove_candidate: d1434def-c269-4c47-83b6-dcc7465a01f0 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c

### Cluster 22

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-06T13:00:00.000Z -> 2026-01-06T14:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: c96891d3-22d2-4767-b41b-3b16c30c36c6 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b
- remove_candidate: 322a4623-9127-40b2-97cb-40de0128ce6b | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b
- remove_candidate: 430a4323-ccae-4a6c-babe-4938f661e67c | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=bf996d87-73a2-4ed5-a2df-a09fcb3c6d25

### Cluster 23

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-06T14:00:00.000Z -> 2026-01-06T15:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 47b8f3d1-aa33-46b7-970a-75bda1724fb7 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b5154cf3-3ecb-4b33-8871-c0690d36bebb
- remove_candidate: 70452bee-dfe0-4657-8acd-92d65240b909 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b5154cf3-3ecb-4b33-8871-c0690d36bebb
- remove_candidate: 59991643-a28b-4ac8-bb41-2cc47fbbbae8 | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=2c7f918e-55e1-4f4b-8261-cd6322259dc4

### Cluster 24

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-07T09:00:00.000Z -> 2026-01-07T10:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 57f22345-493c-4224-9c1e-7e732c9fc5be | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=ee2fe34a-fb61-4a72-9d85-b9b20329697f
- remove_candidate: 890c348a-4b00-467a-8cf7-afa85022ecd8 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=ee2fe34a-fb61-4a72-9d85-b9b20329697f

### Cluster 25

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-07T10:00:00.000Z -> 2026-01-07T11:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 95f333a3-6bb7-48ff-b5ef-dae71f13e619 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=fe6b5f05-a979-46d3-b90a-9d960fbca1db
- remove_candidate: 394db27f-e6ec-4698-bbd8-89112e623ce3 | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=fe6b5f05-a979-46d3-b90a-9d960fbca1db
- remove_candidate: 8aa4c59b-1650-4b87-9842-8aad7366b69a | status=completed | createdAt=2026-01-30T11:23:45.387Z | userId=c1f13688-5cee-4d07-bdc9-b366bf91e33c

### Cluster 26

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-07T13:00:00.000Z -> 2026-01-07T14:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 210db413-2f7c-4755-9d4e-eb33b630d419 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b428b825-a6bc-4ab5-8738-3fd0691273c3
- remove_candidate: f6e22f59-7563-45cb-905e-46bd1d582c48 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b428b825-a6bc-4ab5-8738-3fd0691273c3
- remove_candidate: dff7da12-1546-43f0-a5ba-c4dc7310e7fb | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=c51b07a5-0139-4880-90ba-5803dcd6e97b

### Cluster 27

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-08T08:00:00.000Z -> 2026-01-08T09:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: eabd2c53-b873-4f15-97f5-b6c92428bd77 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=c8eb193d-b37c-4e3e-b04a-4b14ef408efd
- remove_candidate: c4c7a343-2824-4f90-b940-1f2ddfeb2a79 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=c8eb193d-b37c-4e3e-b04a-4b14ef408efd

### Cluster 28

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-30T09:00:00.000Z -> 2026-01-30T10:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 74e55ab4-765a-435b-b977-7c8b927e89a6 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=1430cb93-4233-448e-9527-d41c6735bb13
- remove_candidate: 32d5b0b8-2459-4e78-b933-139533aaa719 | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=1430cb93-4233-448e-9527-d41c6735bb13

### Cluster 29

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-01-31T09:00:00.000Z -> 2026-01-31T10:00:00.000Z
- Appointment count: 3
- Pair conflicts: 3
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 8104689f-615a-4ab7-b8a4-86d6e83e5a25 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=cd6e5f96-c375-46f3-b72f-67e0d81d95a9
- remove_candidate: 3a169ecb-e628-4c4e-bcf1-afd5e61bab1a | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=cd6e5f96-c375-46f3-b72f-67e0d81d95a9
- remove_candidate: aa1283cd-0b78-4013-8789-64528c0c51ea | status=pending | createdAt=2026-01-30T11:23:45.387Z | userId=1430cb93-4233-448e-9527-d41c6735bb13

### Cluster 30

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-02T08:00:00.000Z -> 2026-02-02T09:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 2e5f837e-93fd-448c-98fd-e3d7d3c1dfbb | status=confirmed | createdAt=2026-01-30T14:08:36.882Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439
- remove_candidate: a6cfd395-a53c-4380-9fd9-c8ba84a0d866 | status=pending | createdAt=2026-01-30T14:08:36.882Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439

### Cluster 31

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-02T10:00:00.000Z -> 2026-02-02T11:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 31385882-fda3-461b-bb31-6bd4b166f043 | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=0ebbb5ae-6e3e-4cbe-8fa4-e210057806f2
- remove_candidate: 52b2deb0-ed95-4f50-b5bb-39ad24a90358 | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=0ebbb5ae-6e3e-4cbe-8fa4-e210057806f2

### Cluster 32

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-03T09:30:00.000Z -> 2026-02-03T10:30:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: e0b0b43c-4060-480e-83a7-e64263e84b51 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=933fc5e0-d0e6-4f83-93bd-22f547583103
- remove_candidate: 52d5e880-630b-4033-ad0a-5e34319bb3c0 | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=933fc5e0-d0e6-4f83-93bd-22f547583103

### Cluster 33

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-04T01:00:00.000Z -> 2026-02-04T02:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 89b5bf40-b465-41d0-a5b4-9033a5392235 | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=66aa62a9-b973-44bd-b1b1-f2a798b373bb
- remove_candidate: 015e4a0f-7fe9-40ff-a409-a8be8c996383 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=66aa62a9-b973-44bd-b1b1-f2a798b373bb

### Cluster 34

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-06T07:00:00.000Z -> 2026-02-06T08:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 303424de-b20a-4eb5-a2b4-965e40538e9f | status=pending | createdAt=2026-01-30T13:45:46.380Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439
- remove_candidate: c25fb7d9-f49c-4a89-938a-abada1dc1d6e | status=pending | createdAt=2026-01-30T13:45:46.569Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439

### Cluster 35

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-06T16:00:00.000Z -> 2026-02-06T17:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 5dad062f-59d3-4df2-8598-9dd5c56850fe | status=completed | createdAt=2026-01-29T13:05:35.806Z | userId=6d8b9072-83ca-4f1e-bb41-dd5a246218a8
- remove_candidate: 2fb3d493-1fdb-4fce-913e-6edc689b855c | status=completed | createdAt=2026-01-29T13:18:32.638Z | userId=6d8b9072-83ca-4f1e-bb41-dd5a246218a8

### Cluster 36

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-07T20:00:00.000Z -> 2026-02-07T21:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: b3083634-a20b-43d9-bd44-5acbd53b7151 | status=pending | createdAt=2026-01-29T13:05:35.806Z | userId=d3c85b31-a61c-40c2-b9e0-83e995f4ee19
- remove_candidate: 35041778-e5e2-43a5-a509-848b094893cb | status=pending | createdAt=2026-01-29T13:18:32.638Z | userId=d3c85b31-a61c-40c2-b9e0-83e995f4ee19

### Cluster 37

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-08T23:00:00.000Z -> 2026-02-09T00:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 835652dd-feae-4036-b429-c00522348bce | status=confirmed | createdAt=2026-01-29T13:05:35.806Z | userId=b224656c-f946-4557-ba36-b68a6e3b8ead
- remove_candidate: 7758b326-c45d-4920-9ea0-96fd047ae099 | status=confirmed | createdAt=2026-01-29T13:18:32.638Z | userId=b224656c-f946-4557-ba36-b68a6e3b8ead

### Cluster 38

- Org: 5de7cf30-47ec-42eb-b2c8-3019b8fb2fa8
- Resource: 677af081-8dd5-476c-8f83-22a61293ddeb
- Slot: 2026-02-10T09:00:00.000Z -> 2026-02-10T10:00:00.000Z
- Appointment count: 2
- Pair conflicts: 1
- Suggested action: Keep the earliest created row and cancel/archive the remaining duplicate rows for this exact slot.

- keep_candidate: 1fa434d5-2ba4-4481-b277-14736719d1fb | status=pending | createdAt=2026-01-30T16:25:28.198Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439
- remove_candidate: afaf0bf3-1831-4376-8805-98038d5b646e | status=pending | createdAt=2026-01-30T16:25:28.494Z | userId=edcb28cf-9905-4c90-aeb2-462bde0d5439

