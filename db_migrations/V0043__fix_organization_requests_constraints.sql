ALTER TABLE t_p21120869_mototumen_community_.organization_requests
  DROP CONSTRAINT IF EXISTS organization_requests_organization_type_check;

ALTER TABLE t_p21120869_mototumen_community_.organization_requests
  ADD CONSTRAINT organization_requests_organization_type_check
  CHECK (organization_type IN ('shop', 'service', 'school', 'Магазин', 'Сервис', 'Мотошкола'));

ALTER TABLE t_p21120869_mototumen_community_.organization_requests
  DROP CONSTRAINT IF EXISTS organization_requests_status_check;

ALTER TABLE t_p21120869_mototumen_community_.organization_requests
  ADD CONSTRAINT organization_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));