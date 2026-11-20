
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  skin_type text,
  concerns text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price int NOT NULL CHECK (price >= 0),
  mrp int,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  size text,
  image_url text,
  skin_types text[] NOT NULL DEFAULT '{}',
  concerns text[] NOT NULL DEFAULT '{}',
  key_ingredients text[] NOT NULL DEFAULT '{}',
  how_to_use text,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  review_count int NOT NULL DEFAULT 0,
  is_bestseller boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CART
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own cart" ON public.cart_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- WISHLIST
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wishlist" ON public.wishlist_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own addresses" ON public.addresses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- COUPONS
CREATE TABLE public.coupons (
  code text PRIMARY KEY,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value int NOT NULL CHECK (discount_value > 0),
  min_order int NOT NULL DEFAULT 0,
  max_discount int,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('DD' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5))),
  user_id uuid NOT NULL,
  status public.order_status NOT NULL DEFAULT 'placed',
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  subtotal int NOT NULL,
  discount int NOT NULL DEFAULT 0,
  shipping int NOT NULL DEFAULT 0,
  total int NOT NULL,
  coupon_code text,
  ship_name text NOT NULL,
  ship_phone text NOT NULL,
  ship_line1 text NOT NULL,
  ship_line2 text,
  ship_city text NOT NULL,
  ship_state text NOT NULL,
  ship_pincode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own orders or admin" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  unit_price int NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own order items or admin" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
    AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PRICING: shipping ₹79 below ₹999 subtotal, free from ₹999
CREATE OR REPLACE FUNCTION public.compute_quote(_subtotal int, _coupon text)
RETURNS TABLE (subtotal int, discount int, shipping int, total int, coupon_code text, coupon_message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; d int := 0; msg text := NULL; applied text := NULL; ship int;
BEGIN
  IF _coupon IS NOT NULL AND length(trim(_coupon)) > 0 THEN
    SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_coupon));
    IF NOT FOUND OR NOT c.is_active OR (c.expires_at IS NOT NULL AND c.expires_at < now()) THEN
      msg := 'This coupon code is not valid.';
    ELSIF _subtotal < c.min_order THEN
      msg := 'Add items worth ₹' || (c.min_order - _subtotal) || ' more to use this coupon.';
    ELSE
      IF c.discount_type = 'percent' THEN d := floor(_subtotal * c.discount_value / 100.0);
      ELSE d := c.discount_value; END IF;
      IF c.max_discount IS NOT NULL THEN d := least(d, c.max_discount); END IF;
      d := least(d, _subtotal);
      applied := c.code;
      msg := 'Coupon applied! You saved ₹' || d || '.';
    END IF;
  END IF;
  ship := CASE WHEN _subtotal = 0 OR _subtotal >= 999 THEN 0 ELSE 79 END;
  RETURN QUERY SELECT _subtotal, d, ship, _subtotal - d + ship, applied, msg;
END; $$;
REVOKE EXECUTE ON FUNCTION public.compute_quote(int, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.compute_quote(int, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.quote_cart(_coupon text DEFAULT NULL)
RETURNS TABLE (subtotal int, discount int, shipping int, total int, coupon_code text, coupon_message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  SELECT COALESCE(sum(p.price * ci.quantity), 0)::int INTO s
  FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
  WHERE ci.user_id = auth.uid() AND p.is_active;
  RETURN QUERY SELECT * FROM public.compute_quote(s, _coupon);
END; $$;
REVOKE EXECUTE ON FUNCTION public.quote_cart(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.quote_cart(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.place_order(_address_id uuid, _coupon text DEFAULT NULL, _payment_method text DEFAULT 'cod')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); a public.addresses%ROWTYPE; s int; q record; oid uuid; r record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in'; END IF;
  IF _payment_method <> 'cod' THEN RAISE EXCEPTION 'Only Cash on Delivery is available right now'; END IF;
  SELECT * INTO a FROM public.addresses WHERE id = _address_id AND user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Please choose a delivery address'; END IF;

  -- lock products and check stock
  FOR r IN SELECT p.id, p.name, p.stock, p.is_active, ci.quantity
    FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
    WHERE ci.user_id = uid FOR UPDATE OF p
  LOOP
    IF NOT r.is_active THEN RAISE EXCEPTION '% is no longer available', r.name; END IF;
    IF r.stock < r.quantity THEN RAISE EXCEPTION 'Only % left of %', r.stock, r.name; END IF;
  END LOOP;

  SELECT COALESCE(sum(p.price * ci.quantity), 0)::int INTO s
  FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id WHERE ci.user_id = uid;
  IF s = 0 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;

  SELECT * INTO q FROM public.compute_quote(s, _coupon);
  IF _coupon IS NOT NULL AND length(trim(_coupon)) > 0 AND q.coupon_code IS NULL THEN
    RAISE EXCEPTION '%', q.coupon_message;
  END IF;

  INSERT INTO public.orders (user_id, payment_method, subtotal, discount, shipping, total, coupon_code,
    ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode)
  VALUES (uid, _payment_method, q.subtotal, q.discount, q.shipping, q.total, q.coupon_code,
    a.full_name, a.phone, a.line1, a.line2, a.city, a.state, a.pincode)
  RETURNING id INTO oid;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
  SELECT oid, p.id, p.name, p.image_url, p.price, ci.quantity
  FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id WHERE ci.user_id = uid;

  UPDATE public.products p SET stock = p.stock - ci.quantity
  FROM public.cart_items ci WHERE ci.product_id = p.id AND ci.user_id = uid;

  DELETE FROM public.cart_items WHERE user_id = uid;
  RETURN oid;
END; $$;
REVOKE EXECUTE ON FUNCTION public.place_order(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND OR (o.user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF o.status NOT IN ('placed', 'confirmed') THEN RAISE EXCEPTION 'This order can no longer be cancelled'; END IF;
  UPDATE public.orders SET status = 'cancelled' WHERE id = _order_id;
  UPDATE public.products p SET stock = p.stock + oi.quantity
  FROM public.order_items oi WHERE oi.order_id = _order_id AND oi.product_id = p.id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.cancel_order(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

-- SEED
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
 ('cleansers','Cleansers','Gentle first steps that lift away the day.',1),
 ('toners','Toners','Balance, prep and refresh.',2),
 ('serums','Serums','Concentrated actives for targeted results.',3),
 ('moisturizers','Moisturizers','Hydration that seals it all in.',4),
 ('sunscreens','Sunscreens','Daily protection, zero white cast.',5),
 ('masks','Masks','Weekly rituals for a deeper reset.',6);

INSERT INTO public.products (slug,name,tagline,description,category_id,price,mrp,stock,size,image_url,skin_types,concerns,key_ingredients,how_to_use,rating,review_count,is_bestseller,is_new,is_featured)
SELECT v.slug,v.name,v.tagline,v.description,c.id,v.price,v.mrp,v.stock,v.size,'/products/'||v.slug||'.webp',v.skin_types,v.concerns,v.ing,v.how,v.rating,v.reviews,v.best,v.new,v.feat
FROM (VALUES
 ('rice-water-foaming-cleanser','Rice Water Foaming Cleanser','Soft, brightening everyday foam','A cloud-soft foam made with fermented rice water that lifts dirt and excess oil while leaving skin bright and supple — never tight.','cleansers',499,599,120,'150 ml',ARRAY['normal','combination','oily'],ARRAY['dullness','pigmentation'],ARRAY['Fermented Rice Water','Glycerin','Allantoin'],'Massage a pea-sized amount onto damp skin morning and night, then rinse.',4.6,1284,true,false,false),
 ('salicylic-clarifying-cleanser','Salicylic Clarifying Gel Cleanser','2% BHA for clear, calm pores','A clear gel cleanser with 2% salicylic acid and tea tree that dissolves pore-clogging oil to keep breakouts and blackheads in check.','cleansers',599,699,95,'150 ml',ARRAY['oily','combination'],ARRAY['acne','blackheads'],ARRAY['2% Salicylic Acid','Tea Tree','Zinc PCA'],'Use on damp skin once daily, increasing to twice daily as tolerated.',4.5,962,false,false,false),
 ('oat-ceramide-cream-cleanser','Oat Ceramide Cream Cleanser','Milky cleanse for dry, sensitive skin','A creamy, non-foaming cleanser with colloidal oat and ceramides that removes impurities while protecting the skin barrier.','cleansers',649,749,80,'120 ml',ARRAY['dry','sensitive','normal'],ARRAY['dryness','redness'],ARRAY['Colloidal Oat','Ceramide NP','Panthenol'],'Massage onto dry or damp skin, then rinse with lukewarm water.',4.7,538,false,false,false),
 ('rose-hydrating-toner','Rose Hydrating Toner','Dewy hydration in a mist','Damask rose water and hyaluronic acid deliver an instant drink of hydration and a soft, dewy finish.','toners',799,899,110,'200 ml',ARRAY['dry','normal','sensitive'],ARRAY['dryness','dullness'],ARRAY['Damask Rose Water','Hyaluronic Acid','Betaine'],'Pat into skin with palms after cleansing, morning and night.',4.6,743,false,false,false),
 ('glycolic-resurfacing-toner','Glycolic Resurfacing Toner','7% AHA for smooth, glowing skin','An exfoliating toner with 7% glycolic acid that gently resurfaces texture, fades marks and unclogs pores for a lit-from-within glow.','toners',899,1049,70,'150 ml',ARRAY['oily','combination','normal'],ARRAY['pigmentation','dullness','blackheads','aging'],ARRAY['7% Glycolic Acid','Aloe Vera','Ginseng'],'Sweep over skin with a cotton pad in the evening, 3–4 times a week. Always use sunscreen.',4.4,611,false,false,false),
 ('niacinamide-zinc-serum','Niacinamide 10% + Zinc Serum','Balance oil, blur pores','A lightweight serum with 10% niacinamide and 1% zinc that controls shine, visibly refines pores and fades post-acne marks.','serums',1299,1499,150,'30 ml',ARRAY['oily','combination','normal'],ARRAY['acne','blackheads','dark_spots'],ARRAY['10% Niacinamide','1% Zinc PCA','Hyaluronic Acid'],'Apply 3–4 drops to clean skin morning and night before moisturiser.',4.7,2310,true,false,true),
 ('vitamin-c-brightening-serum','Vitamin C Brightening Serum','15% vitamin C for radiant, even tone','A stabilised 15% vitamin C serum with ferulic acid and vitamin E that brightens dullness and fades dark spots for visibly even skin.','serums',1499,1799,90,'30 ml',ARRAY['normal','combination','dry','oily'],ARRAY['pigmentation','dark_spots','dullness','aging'],ARRAY['15% Ethyl Ascorbic Acid','Ferulic Acid','Vitamin E'],'Apply 3–4 drops each morning, followed by moisturiser and sunscreen.',4.8,1876,true,false,true),
 ('hyaluronic-b5-serum','Hyaluronic Acid + B5 Serum','Multi-depth plumping hydration','Five weights of hyaluronic acid with vitamin B5 flood every layer of skin with moisture for a plump, bouncy feel.','serums',1199,1399,130,'30 ml',ARRAY['dry','normal','combination','oily','sensitive'],ARRAY['dryness','aging'],ARRAY['Multi-weight Hyaluronic Acid','Vitamin B5','Ceramides'],'Apply to damp skin morning and night, then seal with moisturiser.',4.6,1422,false,false,false),
 ('alpha-arbutin-spot-serum','Alpha Arbutin 2% Spot Serum','Targets dark spots and tan','2% alpha arbutin with liquorice root gently fades stubborn dark spots, tanning and uneven tone without irritation.','serums',1099,1299,85,'30 ml',ARRAY['normal','combination','oily','dry'],ARRAY['dark_spots','pigmentation'],ARRAY['2% Alpha Arbutin','Liquorice Root','Niacinamide'],'Apply 2–3 drops to the face or targeted areas twice daily.',4.5,402,false,true,false),
 ('retinol-night-serum','Retinol 0.3% Night Serum','Smooth lines while you sleep','A gentle encapsulated 0.3% retinol with bakuchiol and squalane that softens fine lines, refines texture and clears pores overnight.','serums',1699,1999,60,'30 ml',ARRAY['normal','dry','combination'],ARRAY['aging','acne','pigmentation'],ARRAY['0.3% Encapsulated Retinol','Bakuchiol','Squalane'],'Use 2–3 nights a week at first, building to nightly. Always wear sunscreen by day.',4.6,355,false,true,false),
 ('centella-calming-gel','Centella Calming Gel Moisturiser','Oil-free soothing hydration','A cooling, oil-free gel cream with cica and green tea that calms redness and hydrates breakout-prone skin without heaviness.','moisturizers',899,999,100,'50 g',ARRAY['oily','combination','sensitive'],ARRAY['redness','acne'],ARRAY['Centella Asiatica','Green Tea','Madecassoside'],'Smooth over face and neck as the last step of your routine, morning and night.',4.6,889,false,false,false),
 ('ceramide-barrier-cream','Ceramide Barrier Repair Cream','Rich cream for a stronger barrier','A rich yet breathable cream with five ceramides, shea butter and peptides that repairs a compromised barrier and locks in moisture for 72 hours.','moisturizers',1099,1299,75,'50 g',ARRAY['dry','sensitive','normal'],ARRAY['dryness','redness','aging'],ARRAY['5 Ceramides','Shea Butter','Peptides'],'Apply generously to face and neck morning and night.',4.8,1167,true,false,true),
 ('peach-glow-water-cream','Peach Glow Water Cream','Weightless, bouncy glow','A water-light cream with peach extract and niacinamide that melts into skin, leaving a fresh, glassy glow.','moisturizers',949,1099,90,'50 g',ARRAY['normal','combination','oily'],ARRAY['dullness','dryness'],ARRAY['Peach Extract','Niacinamide','Glycerin'],'Apply a small amount after serum, morning and night.',4.5,276,false,true,false),
 ('invisible-gel-sunscreen','Invisible Gel Sunscreen SPF 50 PA++++','Zero white cast, all-day protection','An ultra-light, invisible gel sunscreen with broad-spectrum SPF 50 PA++++ that leaves no white cast — made for Indian summers.','sunscreens',799,899,160,'50 g',ARRAY['oily','combination','normal'],ARRAY['pigmentation','dark_spots','aging'],ARRAY['Broad Spectrum Filters','Vitamin E','Aloe Vera'],'Apply two finger-lengths as the last step of your morning routine. Reapply every 2–3 hours outdoors.',4.7,3021,true,false,true),
 ('mineral-tinted-sunscreen','Mineral Tinted Sunscreen SPF 40','Gentle mineral protection with a sheer tint','A zinc oxide sunscreen with a universal sheer tint that protects sensitive skin while evening out redness.','sunscreens',899,999,70,'50 ml',ARRAY['sensitive','dry','normal'],ARRAY['redness','pigmentation'],ARRAY['Zinc Oxide','Iron Oxides','Niacinamide'],'Shake well and apply evenly as the last step of your morning routine.',4.4,318,false,false,false),
 ('kaolin-clay-detox-mask','Kaolin Clay Detox Mask','10-minute pore reset','A creamy kaolin and bentonite clay mask with charcoal that draws out excess oil and impurities for clearer, smoother pores.','masks',749,849,65,'100 g',ARRAY['oily','combination'],ARRAY['blackheads','acne'],ARRAY['Kaolin Clay','Bentonite','Activated Charcoal'],'Apply an even layer to clean skin 1–2 times a week. Rinse after 10 minutes.',4.5,507,false,false,false),
 ('lavender-sleeping-mask','Lavender Overnight Sleeping Mask','Wake up to rested, soft skin','A soothing overnight mask with lavender, squalane and peptides that replenishes moisture while you sleep.','masks',999,1199,55,'75 ml',ARRAY['dry','normal','sensitive'],ARRAY['dryness','dullness','aging'],ARRAY['Lavender Extract','Squalane','Peptides'],'Apply as the last step of your night routine 2–3 times a week. Rinse in the morning.',4.7,214,false,true,false)
) AS v(slug,name,tagline,description,cat,price,mrp,stock,size,skin_types,concerns,ing,how,rating,reviews,best,new,feat)
JOIN public.categories c ON c.slug = v.cat;

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order, max_discount) VALUES
 ('WELCOME10','10% off your first ritual (up to ₹300)','percent',10,0,300),
 ('GLOW200','₹200 off orders above ₹1,499','flat',200,1499,NULL),
 ('DEWDROP15','15% off orders above ₹2,499 (up to ₹750)','percent',15,2499,750);
