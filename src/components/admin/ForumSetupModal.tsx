import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, Copy, Check } from "lucide-react";

interface ForumSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForumSetupModal = ({ open, onOpenChange }: ForumSetupModalProps) => {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  const migration1SQL = `create extension if not exists "uuid-ossp";

create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text default 'general' check (category in ('general', 'question', 'review', 'shopping')),
  image_url text,
  views integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(topic_id, user_id)
);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.forum_topics enable row level security;
alter table public.forum_likes enable row level security;
alter table public.forum_replies enable row level security;

create policy "Anyone can view active topics" on public.forum_topics for select using (is_active = true);
create policy "Authenticated users can create topics" on public.forum_topics for insert with check (auth.uid() = user_id);
create policy "Users can update own topics" on public.forum_topics for update using (auth.uid() = user_id);
create policy "Users can delete own topics" on public.forum_topics for delete using (auth.uid() = user_id);
create policy "Anyone can view likes" on public.forum_likes for select using (true);
create policy "Authenticated users can like topics" on public.forum_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike topics" on public.forum_likes for delete using (auth.uid() = user_id);
create policy "Anyone can view replies" on public.forum_replies for select using (true);
create policy "Authenticated users can reply" on public.forum_replies for insert with check (auth.uid() = user_id);
create policy "Users can delete own replies" on public.forum_replies for delete using (auth.uid() = user_id);

create index idx_forum_topics_user_id on public.forum_topics(user_id);
create index idx_forum_topics_category on public.forum_topics(category);
create index idx_forum_topics_created_at on public.forum_topics(created_at desc);
create index idx_forum_likes_topic_id on public.forum_likes(topic_id);
create index idx_forum_replies_topic_id on public.forum_replies(topic_id);`;

  const migration2SQL = `alter table public.forum_topics disable row level security;

insert into public.forum_topics (user_id, title, content, category, views, is_active) values
  ('550e8400-e29b-41d4-a716-446655440000', 'ที่คาเฟ่แจ่งสบายดีจริงๆ', 'ชอบมากค่ะที่นี่ ยิ้มแย้มสนใจดี ร้านสะอาดเรียบร้อย', 'review', 45, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'เมนูกาแฟแนะนำ', 'ลองกาแฟเอสเพรสโซว่างไช่ แนะนำเลยค่ะ เหมาะมากสำหรับการทำงาน', 'review', 67, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'ห้องพักสะอาดและสบาย', 'ห้องพักใหม่ๆ สะอาดมากค่ะ เตียงนอนสบาย มีแอร์ให้หนาวเย็น', 'review', 123, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'มีที่จอดรถไม่ต้องกังวล', 'ที่จอดรถพอใจมากค่ะ ที่จอดกว้างสบาย ปลอดภัยด้วยมีกล้องวงจรปิด', 'general', 34, true),
  ('550e8400-e29b-41d4-a716-446655440000', 'WiFi เร็วเหมาะทำงาน', 'WiFi ได้ความเร็วดีๆ สามารถทำงานและอัดอพโหลดได้สะดวกมากค่ะ', 'general', 56, true);

alter table public.forum_topics enable row level security;`;

  const currentSQL = step === 1 ? migration1SQL : migration2SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔧 Forum Database Setup</DialogTitle>
          <DialogDescription>
            Step {step} of 2: Set up forum tables in Supabase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to Supabase Dashboard SQL Editor</li>
                <li>Click "New Query"</li>
                <li>Copy the SQL below</li>
                <li>Paste and click "Run"</li>
                <li>Then proceed to step 2</li>
              </ol>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Step {step}: {step === 1 ? "Create Tables" : "Add Sample Data"}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{currentSQL}</pre>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠️ After running this SQL in Supabase, click the button below to proceed to the next step.
          </div>

          <div className="flex gap-3 justify-between">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                ← Back to Step 1
              </Button>
            )}
            <div className="flex-1" />
            {step === 1 ? (
              <Button onClick={() => setStep(2)}>
                Done with Step 1 →
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onOpenChange(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                ✓ Setup Complete
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center">
            Need help? Check the Supabase Dashboard for any error messages.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
