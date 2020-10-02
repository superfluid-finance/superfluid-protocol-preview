import styled from "styled-components";

export const Header = styled.header`
  background-color: #000;
  min-height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  color: white;
`;

export const Body = styled.body`
  align-items: center;
  color: white;
  font-size: 15px;
  justify-content: center;
  min-height: calc(100vh - 70px);
  background-color: #000;
  background-size: 100vh; /* You must set a specified height */
  background-position-x: center; /* Center the image */
  background-repeat: no-repeat; /* Do not repeat the image */
  font-family: "Rock Salt", cursive;
  ${({ winner }) => {
    switch (winner) {
      case "winner":
        return `background-image: url("./winning.gif");`;
      case "loser":
        return `background-image: url("./waterfall.gif");`;
      default:
        return `background-color: #000;`;
    }
  }}
`;

export const Image = styled.img`
  height: 10vmin;
  margin-bottom: 16px;
  pointer-events: none;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer"
})`
  color: #61dafb;
  margin-top: 10px;
`;

export const Button = styled.button`
  background-color: #cd4337;
  border: none;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0px 0px 15px 8px rgba(200, 200, 255, 0.75);
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  margin: 10px 20px;
  padding: 12px 24px;

  ${props => props.hidden && "hidden"} :focus {
    border: none;
    outline: none;
  }
`;

export const Center = styled.div`
  text-align: center;
`;

export const Box = styled.div`
  font-size: 1em;
  flex-grow: 1;
  max-width: 33%;
  padding: 14px;
`;

export const BoxContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
`;

export const Left = styled.span`
  text-align: left !important;
`;
