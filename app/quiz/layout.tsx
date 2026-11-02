/**
 * The quiz runs on its own route, deliberately outside the (dashboard) group.
 * A timed assessment should not be framed by a navbar, a sidebar and a mobile
 * tab bar inviting the user to leave halfway through.
 */
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>
}
