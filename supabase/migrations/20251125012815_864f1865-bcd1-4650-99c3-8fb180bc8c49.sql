-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create app_role enum for user roles
create type public.app_role as enum ('admin', 'staff', 'user');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- User roles policies
create policy "User roles are viewable by everyone"
  on public.user_roles for select
  using (true);

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create hero_content table
create table public.hero_content (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title_th text not null,
  title_en text not null,
  subtitle_th text,
  subtitle_en text,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.hero_content enable row level security;

create policy "Hero content is viewable by everyone"
  on public.hero_content for select
  using (true);

create policy "Only admins can modify hero content"
  on public.hero_content for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create event_spaces table
create table public.event_spaces (
  id uuid primary key default gen_random_uuid(),
  title_th text not null,
  title_en text not null,
  description_th text,
  description_en text,
  keywords_th text,
  keywords_en text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.event_spaces enable row level security;

create policy "Event spaces are viewable by everyone"
  on public.event_spaces for select
  using (true);

create policy "Only admins can modify event spaces"
  on public.event_spaces for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create rooms table
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  description_th text,
  description_en text,
  price decimal(10,2) not null,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.rooms enable row level security;

create policy "Rooms are viewable by everyone"
  on public.rooms for select
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Only admins can modify rooms"
  on public.rooms for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create room_images table
create table public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.room_images enable row level security;

create policy "Room images are viewable by everyone"
  on public.room_images for select
  using (true);

create policy "Only admins can modify room images"
  on public.room_images for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create menu_categories table
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text not null,
  sort_order integer default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.menu_categories enable row level security;

create policy "Menu categories are viewable by everyone"
  on public.menu_categories for select
  using (true);

create policy "Only admins can modify menu categories"
  on public.menu_categories for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create menus table
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete set null,
  name_th text not null,
  name_en text not null,
  description_th text,
  description_en text,
  price decimal(10,2) not null,
  image_url text,
  icon_url text,
  is_recommended boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.menus enable row level security;

create policy "Menus are viewable by everyone"
  on public.menus for select
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Only admins can modify menus"
  on public.menus for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create gallery_images table
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title_th text,
  title_en text,
  sort_order integer default 0,
  created_at timestamp with time zone not null default now()
);

alter table public.gallery_images enable row level security;

create policy "Gallery images are viewable by everyone"
  on public.gallery_images for select
  using (true);

create policy "Only admins can modify gallery images"
  on public.gallery_images for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text_th text not null,
  review_text_en text not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Only admins can modify reviews"
  on public.reviews for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
insert into storage.buckets (id, name, public) values
  ('hero', 'hero', true),
  ('event-spaces', 'event-spaces', true),
  ('rooms', 'rooms', true),
  ('menus', 'menus', true),
  ('gallery', 'gallery', true),
  ('reviews', 'reviews', true);

-- Storage policies for hero bucket
create policy "Hero images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'hero');

create policy "Only admins can upload hero images"
  on storage.objects for insert
  with check (bucket_id = 'hero' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update hero images"
  on storage.objects for update
  using (bucket_id = 'hero' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete hero images"
  on storage.objects for delete
  using (bucket_id = 'hero' and public.has_role(auth.uid(), 'admin'));

-- Storage policies for event-spaces bucket
create policy "Event space images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'event-spaces');

create policy "Only admins can upload event space images"
  on storage.objects for insert
  with check (bucket_id = 'event-spaces' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update event space images"
  on storage.objects for update
  using (bucket_id = 'event-spaces' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete event space images"
  on storage.objects for delete
  using (bucket_id = 'event-spaces' and public.has_role(auth.uid(), 'admin'));

-- Storage policies for rooms bucket
create policy "Room images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'rooms');

create policy "Only admins can upload room images"
  on storage.objects for insert
  with check (bucket_id = 'rooms' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update room images"
  on storage.objects for update
  using (bucket_id = 'rooms' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete room images"
  on storage.objects for delete
  using (bucket_id = 'rooms' and public.has_role(auth.uid(), 'admin'));

-- Storage policies for menus bucket
create policy "Menu images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'menus');

create policy "Only admins can upload menu images"
  on storage.objects for insert
  with check (bucket_id = 'menus' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update menu images"
  on storage.objects for update
  using (bucket_id = 'menus' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete menu images"
  on storage.objects for delete
  using (bucket_id = 'menus' and public.has_role(auth.uid(), 'admin'));

-- Storage policies for gallery bucket
create policy "Gallery images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "Only admins can upload gallery images"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update gallery images"
  on storage.objects for update
  using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete gallery images"
  on storage.objects for delete
  using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));

-- Storage policies for reviews bucket
create policy "Review images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'reviews');

create policy "Only admins can upload review images"
  on storage.objects for insert
  with check (bucket_id = 'reviews' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update review images"
  on storage.objects for update
  using (bucket_id = 'reviews' and public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete review images"
  on storage.objects for delete
  using (bucket_id = 'reviews' and public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  
  -- Give first user admin role
  if (select count(*) from auth.users) = 1 then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin');
  else
    -- All other users get 'user' role by default
    insert into public.user_roles (user_id, role)
    values (new.id, 'user');
  end if;
  
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers to tables
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_hero_content_updated_at
  before update on public.hero_content
  for each row execute procedure public.update_updated_at_column();

create trigger update_event_spaces_updated_at
  before update on public.event_spaces
  for each row execute procedure public.update_updated_at_column();

create trigger update_rooms_updated_at
  before update on public.rooms
  for each row execute procedure public.update_updated_at_column();

create trigger update_menus_updated_at
  before update on public.menus
  for each row execute procedure public.update_updated_at_column();

create trigger update_reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.update_updated_at_column();

-- Insert default menu categories
insert into public.menu_categories (name_th, name_en, sort_order) values
  ('กาแฟ', 'Coffee', 1),
  ('เครื่องดื่มไม่มีคาเฟอีน', 'Non-Coffee', 2),
  ('อาหาร', 'Food', 3),
  ('ของหวาน', 'Dessert', 4);