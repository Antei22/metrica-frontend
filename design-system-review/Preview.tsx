import { useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { LoaderCircle, Plus, Check, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../src/app/components/BrandLogo';
import { Button } from '../src/app/components/ui/button';
import { Input } from '../src/app/components/ui/input';
import { Badge } from '../src/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../src/app/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '../src/app/components/ui/dialog';
import { Progress } from '../src/app/components/ui/progress';
import { getAiReviewPresentation } from '../src/app/design-system/status';
import '../src/styles/index.css';
import './review.css';

function Preview() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(18.5);
  function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError('Укажите имя ученика'); return; }
    setError(''); setSaved(`Пример сохранения: ${name.trim()}`); setOpen(false);
  }
  return <div className="ds-preview">
    <header className="ds-top"><BrandLogo /><span>Дизайн-система платформы · 0.1</span><a href="#components">Компоненты</a></header>
    <main className="ds-main">
      <section className="ds-intro">
        <div><p className="ds-kicker">Метрика / UI для обучения</p><h1 className="brand-display">Новое измерение<br /><em>привычной работы</em></h1><p>Фирменный характер — в акцентах. В занятиях, формах и обратной связи — ясность и внимание к содержанию.</p></div>
        <div className="ds-intro-note"><span>Inter</span><span>Noto Sans Display</span><p>Образцы компонентов на существующей основе React + Tailwind + shadcn. Здесь только демонстрационные данные, запросов к API нет.</p></div>
      </section>

      <section className="ds-section" aria-labelledby="palette"><div className="ds-section-heading"><span>01</span><h2 id="palette">Фирменная палитра</h2></div><div className="ds-swatches">{[['Синий','#025BFF'],['Фиолетовый','#7445F8'],['Мятный','#44FF9C'],['Текст','#121A3D']].map(([label,color])=><div className="ds-swatch" key={label}><span style={{background:color}}/><div><strong>{label}</strong><code>{color}</code></div></div>)}</div><p className="ds-caption">Мятный — брендовый акцент, а не универсальный цвет успешного статуса. На мятной подложке используем тёмный текст.</p></section>

      <section id="components" className="ds-section" aria-labelledby="controls"><div className="ds-section-heading"><span>02</span><h2 id="controls">Действия и состояния</h2></div><div className="ds-panel"><div className="ds-buttons"><Button>Сохранить изменения</Button><Button variant="mint">Открыть материалы</Button><Button variant="violet">Посмотреть прогресс</Button><Button variant="outline">Отмена</Button><Button variant="destructive">Удалить</Button><Button disabled>Недоступно</Button><Button disabled aria-busy="true"><LoaderCircle aria-hidden="true" className="animate-spin"/>Сохраняем</Button></div><p className="ds-caption">Основное действие — синее. В одном рабочем блоке одна ведущая кнопка; цвет подтверждения и цвет бренда имеют разные роли.</p></div></section>

      <section className="ds-section" aria-labelledby="workflow"><div className="ds-section-heading"><span>03</span><h2 id="workflow">Один учебный процесс</h2></div><div className="ds-layout"><div className="ds-panel"><div className="ds-row"><h3>Ученики</h3><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm"><Plus aria-hidden="true"/>Добавить</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Добавить ученика</DialogTitle><DialogDescription>Пример формы: данные остаются только на этой странице.</DialogDescription></DialogHeader><form onSubmit={save} className="ds-form"><label htmlFor="student-name">Имя ученика</label><Input id="student-name" value={name} onChange={e=>{setName(e.target.value);setError('');}} aria-invalid={!!error} aria-describedby={error?'name-error':undefined} autoComplete="off"/>{error&&<p id="name-error" role="alert" className="text-danger-foreground">{error}</p>}<Button type="submit">Сохранить</Button></form></DialogContent></Dialog></div><p role="status" className="ds-caption">{saved || 'Демонстрационные данные'}</p><div className="ds-person"><span className="ds-avatar">АС</span><div><strong>Артём Соловьёв</strong><p>Математика · 7 класс</p></div><Badge variant="warning">На проверке</Badge></div><div className="ds-person"><span className="ds-avatar">АМ</span><div><strong>Арина Мошкова</strong><p>Математика · 6 класс</p></div><Badge variant="success">Проверено</Badge></div><div className="ds-field"><label htmlFor="search-example">Поиск ученика — пример поля</label><Input id="search-example" placeholder="Имя или фамилия"/></div></div>

      <div className="ds-progress"><div className="ds-row"><p>Прогресс и награды</p><Badge variant="secondary">Пример</Badge></div><h3 className="brand-display">Каждый шаг<br /><em>имеет значение</em></h3><p className="ds-star-value"><strong>{stars.toLocaleString('ru-RU')}</strong><span>из 30 звёзд</span></p><div className="ds-mint-progress"><Progress value={Math.min(100,stars/30*100)} aria-label="Звёзды до награды"/></div><p>Звёзды до награды — отдельная механика. Это не процент освоения предмета.</p><Button variant="mint" onClick={()=>setStars(s=>s>=30?18.5:Math.min(30,s+.5))}><Plus aria-hidden="true"/>0,5 звезды</Button></div></div></section>

      <section className="ds-section" aria-labelledby="feedback"><div className="ds-section-heading"><span>04</span><h2 id="feedback">Обратная связь и статусы</h2></div><div className="ds-panel"><Tabs defaultValue="homework"><TabsList aria-label="Примеры обратной связи"><TabsTrigger value="homework">Домашняя работа</TabsTrigger><TabsTrigger value="ai">Проверка с ИИ</TabsTrigger></TabsList><TabsContent value="homework"><div className="ds-feedback"><div><Badge variant="success"><Check aria-hidden="true"/>Проверено</Badge><h3>Квадратные уравнения</h3><p>Все основные шаги верны. Продолжим работу со сложными примерами.</p><p className="ds-caption">Комментарий репетитора · демонстрационные данные</p></div><span className="ds-grade" aria-label="Оценка 5">5</span></div></TabsContent><TabsContent value="ai"><div className="ds-status-list">{(['not_started','pending','running','completed','failed'] as const).map(state=>{const view=getAiReviewPresentation(state);return <div key={state}><code>{state}</code><Badge variant={view.tone}>{view.label}</Badge></div>})}</div><p className="ds-caption">Это состояния существующего API, а не автоматическое подтверждение работоспособности сервиса.</p></TabsContent></Tabs></div></section>

      <section className="ds-section" aria-labelledby="fields"><div className="ds-section-heading"><span>05</span><h2 id="fields">Формы без неоднозначности</h2></div><div className="ds-fields"><div className="ds-field"><label htmlFor="normal-field">Тема занятия</label><Input id="normal-field" defaultValue="Квадратные уравнения"/></div><div className="ds-field"><label htmlFor="invalid-field">Имя ученика</label><Input id="invalid-field" aria-invalid="true" aria-describedby="field-error"/><p className="text-danger-foreground text-sm" id="field-error">Укажите имя ученика</p></div><div className="ds-field"><label htmlFor="disabled-field">Доступное позже</label><Input id="disabled-field" disabled value="Недоступно" readOnly/></div></div></section>
      <footer className="ds-footer"><p>Метрика · Кандидат для интеграции, не production-кабинет</p><a href="#components">К компонентам <ArrowRight aria-hidden="true"/></a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
