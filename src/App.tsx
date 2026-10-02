import { useState, useEffect } from 'react';
import './App.css';

interface Event {
  id: number;
  subject: string;
  source?: string;
  labels: string[];
  payload: Record<string, any>;
  ts: number;
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [labelsFilter, setLabelsFilter] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subjectFilter) params.append('type', subjectFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (labelsFilter) params.append('labels', labelsFilter);

      const resp = await fetch(`/events?${params.toString()}`);
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const formatPayload = (payload: Record<string, any>) => {
    if (!payload || typeof payload !== 'object') return String(payload);
    return Object.entries(payload).map(([k, v]) => 
      `<span class="key">${escapeHtml(k)}</span>: <span class="val">${escapeHtml(String(v))}</span>`
    ).join(', ');
  };

  const escapeHtml = (str: string) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const formatTs = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>⚡ EventBus Explorer</h1>
        <span className="count-badge">{events.length} events</span>
      </header>

      {/* Filter Form */}
      <form className="filters" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>Type (subject)</label>
          <input
            type="text"
            placeholder="e.g., user.*"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Source</label>
          <input
            type="text"
            placeholder="e.g., api-server"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Labels (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g., env:prod,user:admin"
            value={labelsFilter}
            onChange={(e) => setLabelsFilter(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Events'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Events List */}
      <main className="events-container">
        {events.length === 0 && !loading ? (
          <div className="empty-state">
            <span className="icon">🔍</span>
            <p>No events found matching your filters.</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => {
              const isExpanded = expandedId === event.id;
              
              return (
                <div 
                  key={event.id} 
                  className={`event-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(event.id)}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <span className="event-type">{escapeHtml(event.subject)}</span>
                    <span className="event-source" title={event.source || ''}>
                      {event.source || '-'}
                    </span>
                    <span className="event-time">{formatTs(event.ts)}</span>
                    <button 
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(event.id);
                      }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  {/* Card Body - Basic Info */}
                  <div className="card-body">
                    <div className="basic-info">
                      <span className="event-id">ID: {event.id}</span>
                      <div className="labels-container">
                        {event.labels.map((label, idx) => (
                          <span key={idx} className="label-badge">{escapeHtml(label)}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="card-expanded">
                      <h4>Full Payload</h4>
                      <pre 
                        className="payload-pre"
                        dangerouslySetInnerHTML={{ __html: formatPayload(event.payload) }}
                      />
                      
                      <h4>Raw Data</h4>
                      <table className="raw-data-table">
                        <tbody>
                          <tr>
                            <th>ID</th>
                            <td>{event.id}</td>
                          </tr>
                          <tr>
                            <th>Type</th>
                            <td>{escapeHtml(event.subject)}</td>
                          </tr>
                          <tr>
                            <th>Source</th>
                            <td>{event.source || '-'}</td>
                          </tr>
                          <tr>
                            <th>Labels</th>
                            <td>
                              {event.labels.map((label, idx) => (
                                <span key={idx} className="raw-label">{escapeHtml(label)}</span>
                              ))}
                            </td>
                          </tr>
                          <tr>
                            <th>Timestamp</th>
                            <td>{formatTs(event.ts)}</td>
                          </tr>
                          <tr>
                            <th>Payload (JSON)</th>
                            <td>
                              <pre className="json-pre">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
