import styles from './LinkedIn.module.css'

const LINKS = [
  {
    category: 'Search',
    items: [
      { label: 'Search People', desc: 'Find students, teachers, founders', url: 'https://www.linkedin.com/search/results/people/', icon: '🔍' },
      { label: 'Search Schools', desc: 'Find high schools in your area', url: 'https://www.linkedin.com/search/results/companies/?keywords=high+school', icon: '🏫' },
      { label: 'Search "High School Entrepreneurs"', desc: 'Find relevant groups and people', url: 'https://www.linkedin.com/search/results/all/?keywords=high+school+entrepreneurs', icon: '🚀' },
      { label: 'Search "Student Founders"', desc: 'Find your audience', url: 'https://www.linkedin.com/search/results/all/?keywords=student+founders', icon: '💡' },
    ]
  },
  {
    category: 'Your Activity',
    items: [
      { label: 'My Profile', desc: 'View and edit your profile', url: 'https://www.linkedin.com/in/me/', icon: '👤' },
      { label: 'Messages', desc: 'Check and send messages', url: 'https://www.linkedin.com/messaging/', icon: '✉️' },
      { label: 'Notifications', desc: 'See who engaged with you', url: 'https://www.linkedin.com/notifications/', icon: '🔔' },
      { label: 'Network', desc: 'Manage connections and invites', url: 'https://www.linkedin.com/mynetwork/', icon: '🤝' },
      { label: 'Invitations', desc: 'Pending connection requests', url: 'https://www.linkedin.com/mynetwork/invitation-manager/', icon: '📬' },
    ]
  },
  {
    category: 'Content',
    items: [
      { label: 'Create a Post', desc: 'Share something with your network', url: 'https://www.linkedin.com/post/new/', icon: '✍️' },
      { label: 'My Posts & Activity', desc: 'See your recent activity', url: 'https://www.linkedin.com/in/me/recent-activity/all/', icon: '📋' },
    ]
  },
  {
    category: 'Who Else Outreach',
    items: [
      { label: 'Search Austin Christian University', desc: 'Find ACU students and staff', url: 'https://www.linkedin.com/search/results/people/?keywords=austin+christian+university', icon: '🎓' },
      { label: 'Search Genesis Studios', desc: 'Find Genesis network', url: 'https://www.linkedin.com/search/results/all/?keywords=genesis+studios+ACU', icon: '⚡' },
      { label: 'Search High School Advisor', desc: 'Find teacher advisors', url: 'https://www.linkedin.com/search/results/people/?keywords=high+school+business+advisor', icon: '📚' },
    ]
  },
]

function CustomSearch() {
  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const query = encodeURIComponent(e.target.value.trim())
      window.open(`https://www.linkedin.com/search/results/all/?keywords=${query}`, '_blank')
      e.target.value = ''
    }
  }
  return (
    <div className={styles.customSearch}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search LinkedIn… (press Enter)"
        onKeyDown={handleSearch}
      />
    </div>
  )
}

export default function LinkedIn() {
  const open = (url) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>LinkedIn</h2>
          <p className={styles.sub}>Opens in a new tab — LinkedIn can't be embedded</p>
        </div>
        <button className={styles.openLiBtn} onClick={() => open('https://www.linkedin.com/feed/')}>
          Open LinkedIn →
        </button>
      </div>

      <CustomSearch />

      {LINKS.map(group => (
        <div key={group.category} className={styles.group}>
          <div className={styles.groupLabel}>{group.category}</div>
          <div className={styles.grid}>
            {group.items.map(item => (
              <button
                key={item.label}
                className={styles.linkCard}
                onClick={() => open(item.url)}
              >
                <span className={styles.linkIcon}>{item.icon}</span>
                <div className={styles.linkBody}>
                  <div className={styles.linkLabel}>{item.label}</div>
                  <div className={styles.linkDesc}>{item.desc}</div>
                </div>
                <span className={styles.arrow}>↗</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.note}>
        <strong>Tip:</strong> Open LinkedIn in one browser tab and keep your hub in another. Use the custom search above to jump directly to any LinkedIn search.
      </div>
    </div>
  )
}
