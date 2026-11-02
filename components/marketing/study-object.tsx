/**
 * The AIIQ hero object: a stack of study material whose top sheet has become a
 * quiz question. Rendered in the same soft, warm, premium material language as
 * the rest of the site — but it states the product in one glance.
 *
 * Purely decorative; hidden from assistive tech.
 */
export function StudyObject({ size = 300 }: { size?: number }) {
  const w = size
  const h = size * 0.92

  return (
    <div className="relative" style={{ width: w, height: h }} aria-hidden>
      {/* Champagne bloom behind the stack */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          left: '8%',
          top: '18%',
          width: w * 0.84,
          height: h * 0.6,
          background:
            'radial-gradient(ellipse at 40% 50%, rgba(205,160,111,0.34), rgba(205,160,111,0) 70%)',
        }}
      />

      {/* Back sheet — the raw source material */}
      <div
        className="absolute rounded-2xl"
        style={{
          left: '13%',
          top: '4%',
          width: w * 0.7,
          height: h * 0.74,
          background: 'linear-gradient(160deg,#ffffff 0%,#efeeeb 100%)',
          transform: 'rotate(-7deg)',
          boxShadow: '0 18px 34px -20px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.9)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      />

      {/* Middle sheet */}
      <div
        className="absolute rounded-2xl"
        style={{
          left: '17%',
          top: '7%',
          width: w * 0.7,
          height: h * 0.74,
          background: 'linear-gradient(160deg,#ffffff 0%,#f4f3f1 100%)',
          transform: 'rotate(-2.5deg)',
          boxShadow: '0 20px 38px -22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.9)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      />

      {/* Front sheet — now a question */}
      <div
        className="absolute rounded-2xl overflow-hidden"
        style={{
          left: '20%',
          top: '11%',
          width: w * 0.7,
          height: h * 0.74,
          background: 'linear-gradient(165deg,#ffffff 0%,#fbfaf8 100%)',
          transform: 'rotate(2deg)',
          boxShadow:
            '0 34px 54px -26px rgba(0,0,0,0.32), 0 4px 10px -4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="flex flex-col"
          style={{ padding: w * 0.055, gap: w * 0.032, height: '100%' }}
        >
          {/* Question text, abstracted as rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: w * 0.021 }}>
            <div style={{ height: w * 0.022, width: '78%', borderRadius: 99, background: '#26241f' }} />
            <div style={{ height: w * 0.022, width: '52%', borderRadius: 99, background: '#26241f' }} />
          </div>

          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', marginTop: w * 0.012 }} />

          {/* Options — the third is the champagne-marked answer */}
          {[0, 1, 2, 3].map((i) => {
            const correct = i === 2
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: w * 0.028,
                  padding: `${w * 0.021}px ${w * 0.028}px`,
                  borderRadius: w * 0.038,
                  background: correct ? 'rgba(205,160,111,0.13)' : 'rgba(0,0,0,0.028)',
                  border: correct
                    ? '1px solid rgba(169,119,75,0.5)'
                    : '1px solid rgba(0,0,0,0.045)',
                }}
              >
                <div
                  style={{
                    width: w * 0.05,
                    height: w * 0.05,
                    borderRadius: w * 0.017,
                    flexShrink: 0,
                    background: correct
                      ? 'linear-gradient(135deg,#cda06f,#9c6d44)'
                      : 'rgba(0,0,0,0.06)',
                  }}
                />
                <div
                  style={{
                    height: w * 0.018,
                    width: `${[62, 48, 70, 40][i]}%`,
                    borderRadius: 99,
                    background: correct ? 'rgba(122,84,49,0.75)' : 'rgba(0,0,0,0.17)',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
