import { useContext } from "react";
import { HapticContext } from "./haptics/HapticEngine";
import "./HapticTest.css";

/**
 * Manual test page for haptic feedback
 * This component allows manual testing of all three haptic patterns
 * and displays browser support information
 */
export default function HapticTest() {
  const hapticEngine = useContext(HapticContext);
  const isSupported = hapticEngine.isHapticSupported();

  return (
    <div className="haptic-test">
      <h1>Haptic Feedback Test</h1>

      <div className="support-status">
        <h2>Browser Support</h2>
        <p className={isSupported ? "supported" : "unsupported"}>
          Vibration API: {isSupported ? "✓ Supported" : "✗ Not Supported"}
        </p>
        {!isSupported && (
          <p className="note">
            Note: Haptic feedback will silently no-op on this browser. This is
            expected behavior for browsers like iOS Safari.
          </p>
        )}
      </div>

      <div className="test-buttons">
        <h2>Test Haptic Patterns</h2>

        <button
          className="test-button success"
          onClick={() => hapticEngine.trigger("Success")}
        >
          <span className="emoji">✓</span>
          <span className="label">Success</span>
          <span className="spec">50ms pulse</span>
        </button>

        <button
          className="test-button miss"
          onClick={() => hapticEngine.trigger("Miss")}
        >
          <span className="emoji">✗</span>
          <span className="label">Miss</span>
          <span className="spec">20ms soft tap</span>
        </button>

        <button
          className="test-button breach"
          onClick={() => hapticEngine.trigger("Breach")}
        >
          <span className="emoji">⚠</span>
          <span className="label">Breach</span>
          <span className="spec">100ms-50ms-100ms double-thud</span>
        </button>
      </div>

      <div className="instructions">
        <h2>Testing Instructions</h2>
        <ul>
          <li>
            <strong>Supported devices:</strong> Tap each button to feel the
            haptic feedback pattern
          </li>
          <li>
            <strong>Success:</strong> Should feel like a single sharp pulse
          </li>
          <li>
            <strong>Miss:</strong> Should feel like a soft, brief ghost tap
          </li>
          <li>
            <strong>Breach:</strong> Should feel like two heavy thuds with a
            brief gap
          </li>
          <li>
            <strong>Unsupported browsers:</strong> Buttons will work but no
            vibration will occur (graceful degradation)
          </li>
        </ul>
      </div>
    </div>
  );
}
