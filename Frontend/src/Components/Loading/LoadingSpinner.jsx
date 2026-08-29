import PropTypes from "prop-types";

const LoadingSpinner = ({ size = 48, color = "#075985", overlay = true }) => {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        borderTop: `4px solid ${color}`,
        borderRight: "4px solid transparent",
        borderBottom: "4px solid transparent",
        borderLeft: "4px solid transparent",
        animation: "spin 0.9s linear infinite",
      }}
    />
  );

  if (!overlay) {
    return (
      <>
        {spinner}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}} />
      </>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.7)",
        zIndex: 10,
      }}
    >
      {spinner}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default LoadingSpinner;

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  overlay: PropTypes.bool,
};
