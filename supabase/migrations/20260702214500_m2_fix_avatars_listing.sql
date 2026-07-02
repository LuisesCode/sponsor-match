-- M2-Fix (Advisor 0025): Public Buckets liefern Objekt-URLs ohne SELECT-Policy;
-- die breite Policy erlaubte zusätzlich das Auflisten aller Dateien — weg damit.
drop policy "avatars_public_read" on storage.objects;
