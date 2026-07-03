-- =====================================================================
-- M3-Fix: Der M2-Fix (Advisor 0025) entfernte die einzige SELECT-Policy
-- auf dem avatars-Bucket. Ohne SELECT scheitern Upsert und Delete des
-- Besitzers an RLS (ON CONFLICT bzw. Objekt-Lookup brauchen Lesezugriff).
-- Lösung: Besitzer dürfen die Objekte im eigenen Ordner lesen — das
-- Auflisten fremder Dateien bleibt weiterhin unterbunden; öffentliche
-- Auslieferung läuft ohnehin über die Public-Bucket-URLs.
-- =====================================================================

create policy "avatars_owner_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
