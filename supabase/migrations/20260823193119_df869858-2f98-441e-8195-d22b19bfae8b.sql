
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT 'Korisnik',
  bio text,
  location text,
  avatar_url text,
  public_contact text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.profile_contacts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_own_all" ON public.profile_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_description text,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'ostalo',
  images text[] NOT NULL DEFAULT '{}',
  location text,
  status text NOT NULL DEFAULT 'dostupno',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_seller_idx ON public.products(seller_id);
CREATE INDEX products_category_idx ON public.products(category);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT
  USING (status IN ('dostupno', 'rezervisano', 'prodato'));
CREATE POLICY "products_owner_read" ON public.products FOR SELECT TO authenticated
  USING (auth.uid() = seller_id);
CREATE POLICY "products_owner_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_owner_update" ON public.products FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_owner_delete" ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = seller_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_participants_idx ON public.messages(sender_id, receiver_id);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participant_read" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_send" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_mark_read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profile_contacts (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "product_images_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "product_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.profiles (id, name, bio, location, avatar_url, is_demo) VALUES
 ('11111111-1111-4111-8111-111111111111', 'Milica Jovanović', 'Ručno vezem i ukrašavam tekstil po tradicionalnim motivima iz Šumadije. Svaki komad radim sama, od skice do poslednjeg boda.', 'Kragujevac', '/images/demo-seller-1.jpg', true),
 ('22222222-2222-4222-8222-222222222222', 'Keramika Zorić', 'Mala porodična radionica keramike. Sve posude izrađujemo na vitlu i pečemo u sopstvenoj peći.', 'Novi Sad', '/images/demo-seller-2.jpg', true),
 ('33333333-3333-4333-8333-333333333333', 'Drvorez Petrović', 'Rezbarim drvo više od dvadeset godina. Suveniri, kutije i ukrasi od oraha, javora i trešnje.', 'Užice', '/images/demo-seller-3.jpg', true),
 ('44444444-4444-4444-8444-444444444444', 'Ateljé Nit', 'Nakit i pletene torbe od prirodnih materijala. Autentični komadi u malim serijama.', 'Beograd', '/images/demo-seller-4.jpg', true);

INSERT INTO public.products (seller_id, name, short_description, description, price, category, images, location, status, created_at) VALUES
 ('11111111-1111-4111-8111-111111111111', 'Ručno vezen stolnjak sa cvetnim motivom', 'Beli laneni stolnjak sa ručno vezenim cvetnim bordurama.', 'Stolnjak od 100% lana, dimenzije 140x180 cm. Vez je rađen ručno, pamučnim koncem, po motivima tradicionalnog šumadijskog veza. Rad je trajao oko tri nedelje. Perivo na 30°C.', 8900, 'tekstil-i-vez', ARRAY['/images/prod-tekstil-1.jpg'], 'Kragujevac', 'dostupno', now() - interval '2 days'),
 ('11111111-1111-4111-8111-111111111111', 'Vezena jastučnica sa ružama', 'Pamučna jastučnica sa ručnim vezom.', 'Jastučnica 40x40 cm od debljeg pamuka, ručno vezena tehnikom ravnog boda. Dostupna i u drugim bojama po dogovoru.', 2400, 'tekstil-i-vez', ARRAY['/images/prod-tekstil-2.jpg'], 'Kragujevac', 'dostupno', now() - interval '5 days'),
 ('11111111-1111-4111-8111-111111111111', 'Tradicionalna tkana dekoracija za zid', 'Tkani zidni ukras od vunenog prediva.', 'Ručno tkano na razboju, od domaće vune obojene prirodnim bojama. Dimenzije 60x90 cm, sa drvenom šipkom za kačenje.', 12500, 'tradicionalne-rukotvorine', ARRAY['/images/prod-tekstil-3.jpg'], 'Kragujevac', 'dostupno', now() - interval '9 days'),
 ('22222222-2222-4222-8222-222222222222', 'Ručno rađena keramička činija', 'Činija od gline, glazirana u zemljanim tonovima.', 'Činija promera 22 cm, izrađena na vitlu i pečena na 1200°C. Bezbedna za mašinu za sudove i mikrovalnu. Boja može blago varirati od komada do komada.', 3200, 'keramika', ARRAY['/images/prod-keramika-1.jpg'], 'Novi Sad', 'dostupno', now() - interval '1 day'),
 ('22222222-2222-4222-8222-222222222222', 'Keramička šolja sa potpisom majstora', 'Šolja od 300 ml sa matiranom glazurom.', 'Ručno izrađena šolja, zapremine 300 ml. Ergonomska ručka, mat glazura u boji peska. Idealna za jutarnju kafu.', 1800, 'keramika', ARRAY['/images/prod-keramika-2.jpg'], 'Novi Sad', 'dostupno', now() - interval '4 days'),
 ('22222222-2222-4222-8222-222222222222', 'Set od dve keramičke posude za začine', 'Mali set posuda sa drvenim poklopcem.', 'Dve posude promera 8 cm sa poklopcima od bukovog drveta. Savršen poklon za kuhinju.', 2600, 'kuca-i-dekoracija', ARRAY['/images/prod-keramika-3.jpg'], 'Novi Sad', 'rezervisano', now() - interval '11 days'),
 ('33333333-3333-4333-8333-333333333333', 'Drvena ukrasna kutija od oraha', 'Rezbarena kutija za sitnice.', 'Kutija dimenzija 20x14x8 cm od masivnog oraha, sa ručno rezbarenim geometrijskim motivom na poklopcu. Završna obrada prirodnim voskom.', 5400, 'drvo', ARRAY['/images/prod-drvo-1.jpg'], 'Užice', 'dostupno', now() - interval '3 days'),
 ('33333333-3333-4333-8333-333333333333', 'Drveni suvenir - kućica iz Zlatibora', 'Mali drveni suvenir, ručno rezbaren.', 'Suvenir visine 10 cm od javorovog drveta. Pogodan za suvenirnice i poklon pakete, moguća izrada u većim količinama.', 1200, 'tradicionalne-rukotvorine', ARRAY['/images/prod-drvo-2.jpg'], 'Užice', 'dostupno', now() - interval '7 days'),
 ('33333333-3333-4333-8333-333333333333', 'Drvena daska za serviranje', 'Daska od trešnjinog drveta sa ručkom.', 'Daska 35x18 cm, uljena maslinovim uljem. Za serviranje sira, mesa i grickalica.', 3600, 'kuca-i-dekoracija', ARRAY['/images/prod-drvo-3.jpg'], 'Užice', 'dostupno', now() - interval '13 days'),
 ('44444444-4444-4444-8444-444444444444', 'Ručno rađene minđuše od mesinga', 'Lagane minđuše sa geometrijskim oblikom.', 'Minđuše od mesinga sa srebrnim kopčama, dužine 4 cm. Svaki par je ručno oblikovan i poliran, pa se komadi blago razlikuju.', 2200, 'nakit-i-modni-detalji', ARRAY['/images/prod-nakit-1.jpg'], 'Beograd', 'dostupno', now() - interval '1 day'),
 ('44444444-4444-4444-8444-444444444444', 'Pletena torba od prirodnog kanapa', 'Ručno heklana torba za svaki dan.', 'Torba od jute i pamučnog kanapa, sa postavom od platna i unutrašnjim džepom. Dimenzije 32x30 cm.', 4700, 'nakit-i-modni-detalji', ARRAY['/images/prod-nakit-2.jpg'], 'Beograd', 'dostupno', now() - interval '6 days'),
 ('44444444-4444-4444-8444-444444444444', 'Ogrlica sa keramičkim privezom', 'Ogrlica sa ručno oslikanim privezom.', 'Kožna traka sa keramičkim privezom oslikanim kobalt plavom bojom. Dužina 45 cm, podesiva.', 2900, 'nakit-i-modni-detalji', ARRAY['/images/prod-nakit-3.jpg'], 'Beograd', 'dostupno', now() - interval '10 days'),
 ('11111111-1111-4111-8111-111111111111', 'Ukras za zid od suvog cveća', 'Venac od suvog cveća i lana.', 'Venac promera 30 cm od suvog cveća, lavande i lanene trake. Traje godinama uz minimalnu negu.', 3100, 'dekoracija', ARRAY['/images/prod-dekor-1.jpg'], 'Kragujevac', 'dostupno', now() - interval '8 days'),
 ('44444444-4444-4444-8444-444444444444', 'Poklon set: sapun i pletena krpa', 'Ručno rađen poklon set za kupatilo.', 'Set sadrži prirodni sapun sa lavandom i heklanu krpu od organskog pamuka, upakovane u lanenu kesicu.', 1900, 'pokloni', ARRAY['/images/prod-poklon-1.jpg'], 'Beograd', 'dostupno', now() - interval '12 days');
