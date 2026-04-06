import { useState } from 'react'
import Panel, { Field, Input, Textarea, SaveBtn } from '../components/Panel'
import styles from './Pitch.module.css'

function WaitlistForm({ people, store, onClose }) {
  const [f, setF] = useState({ name: '', role: 'student', email: '', school: '', idea: '' })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => {
    if (!f.name) return
    store.addPerson({ name: f.name, role: 'waitlist', contact: f.email, school: f.school, idea: f.idea, grade: f.role, lastTopic: '', notes: 'Added via waitlist form' })
    onClose()
  }
  return (
    <>
      <Field label="Name *"><Input value={f.name} onChange={s('name')} placeholder="Full name" /></Field>
      <Field label="I am a…">
        <select className={styles.select} value={f.role} onChange={s('role')}>
          <option value="student">Student — I have an idea</option>
          <option value="teacher">Teacher / Advisor</option>
          <option value="parent">Parent</option>
          <option value="mentor">Mentor / Investor</option>
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Email"><Input type="email" value={f.email} onChange={s('email')} placeholder="you@email.com" /></Field>
        <Field label="School / Org"><Input value={f.school} onChange={s('school')} /></Field>
      </div>
      <Field label="What are you building / interested in?"><Textarea value={f.idea} onChange={s('idea')} style={{ minHeight: 70 }} /></Field>
      <SaveBtn onClick={save}>Submit →</SaveBtn>
    </>
  )
}

function EditorForm({ portfolio, onSave, onClose }) {
  const [f, setF] = useState({ ...portfolio })
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const save = () => { onSave(f); onClose() }
  return (
    <>
      <Field label="Club Name"><Input value={f.name} onChange={s('name')} /></Field>
      <Field label="Tagline"><Input value={f.tagline} onChange={s('tagline')} /></Field>
      <Field label="Powered By"><Input value={f.powered} onChange={s('powered')} /></Field>
      <Field label="The Question"><Input value={f.question} onChange={s('question')} /></Field>
      <Field label="Question sub-text"><Textarea value={f.questionSub} onChange={s('questionSub')} /></Field>
      <Field label="Mission (What We Are)"><Textarea value={f.mission} onChange={s('mission')} /></Field>
      <Field label="Infrastructure paragraph"><Textarea value={f.infra} onChange={s('infra')} /></Field>
      <Field label="What Members Get (one per line)">
        <Textarea
          value={f.offers.join('\n')}
          onChange={e => setF(p => ({ ...p, offers: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))}
        />
      </Field>
      <Field label="Who Should Join (one per line)">
        <Textarea
          value={f.who.join('\n')}
          onChange={e => setF(p => ({ ...p, who: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) }))}
        />
      </Field>
      <Field label="Teachers / Partners message"><Textarea value={f.teachersMsg} onChange={s('teachersMsg')} /></Field>
      <Field label="Contact Email"><Input value={f.email} onChange={s('email')} /></Field>
      <SaveBtn onClick={save}>Save Pitch Page</SaveBtn>
    </>
  )
}

export default function Pitch({ store }) {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const p = store.portfolio

  const students = store.people.filter(x => x.role === 'student').length
  const teachers = store.people.filter(x => x.role === 'teacher').length
  const waitlist = store.people.filter(x => x.role === 'waitlist').length
  const meetings = store.meetings.length

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>Faith + Founders</div>
        <h1 className={styles.heroName}>{p.name}</h1>
        <p className={styles.heroTagline}>{p.tagline}</p>
        <p className={styles.heroPowered}>{p.powered}</p>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.wide}`}>
          <div className={styles.cardLabel}>The Question</div>
          <div className={styles.cardQuote}>{p.question}</div>
          <div className={styles.cardSub}>{p.questionSub}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>What We Are</div>
          <div className={styles.cardBody}>{p.mission}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>The Infrastructure</div>
          <div className={styles.cardBody}>{p.infra}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Who Should Join</div>
          <ul className={styles.list}>
            {p.who.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>What Members Get</div>
          <ul className={styles.list}>
            {p.offers.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <div className={`${styles.card} ${styles.wide} ${styles.dark}`}>
          <div className={styles.darkLabel}>For Teachers & Partners</div>
          <div className={styles.darkBody}>{p.teachersMsg}</div>
          <div className={styles.ctaRow}>
            <span className={styles.ctaEmail}>{p.email}</span>
            <button className={styles.joinBtn} onClick={() => setWaitlistOpen(true)}>Join Waitlist →</button>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{students}</span><span className={styles.statLbl}>Students</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{teachers}</span><span className={styles.statLbl}>Advisors</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{waitlist}</span><span className={styles.statLbl}>Waitlist</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{meetings}</span><span className={styles.statLbl}>Meetings</span></div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button className={styles.editBtn} onClick={() => setEditOpen(true)}>Edit pitch page</button>
      </div>

      <Panel title="Join the Waitlist" open={waitlistOpen} onClose={() => setWaitlistOpen(false)}>
        <WaitlistForm people={store.people} store={store} onClose={() => setWaitlistOpen(false)} />
      </Panel>

      <Panel title="Edit Pitch Page" open={editOpen} onClose={() => setEditOpen(false)}>
        <EditorForm
          portfolio={p}
          onSave={store.updatePortfolio}
          onClose={() => setEditOpen(false)}
        />
      </Panel>
    </div>
  )
}
