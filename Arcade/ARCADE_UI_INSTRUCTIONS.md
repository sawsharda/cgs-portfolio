# Interactive Arcade UI Instructions

This document explains how to update the 3D Arcade Machine interactive hover cards, including updating the URLs, images, and text. 

## 1. Changing the "Play Now" Redirect Link
When a user clicks either the Hover Card or the Arcade Machine itself, they are redirected to a website. This logic is handled in **`src/components/ShopModel.jsx`**.

**To update the clickable URL:**
1. Open `src/components/ShopModel.jsx`.
2. **Update the Card Click:** Scroll down to the `<HoverCard />` component (around line 200). Change the `window.open` URL:
   ```javascript
   <HoverCard 
     position={popupPos} 
     visible={!!hoveredNode} 
     onClick={() => window.open("YOUR_NEW_URL_HERE", "_blank")} 
     // ...
   />
   ```
3. **Update the Cabinet Click:** Scroll to the `handleClick` function (around line 125). Update this URL so that clicking the physical 3D machine body continues to work:
   ```javascript
   const handleClick = (e) => {
     // ...
     if (cabinet) {
       e.stopPropagation();
       window.open("YOUR_NEW_URL_HERE", "_blank"); // <-- UPDATE THIS
       return;
     }
   };
   ```

## 2. Changing the Hover Card Image and Text
The visual design and content of the pop-up card is isolated in its own CSS-driven component.

**To update the graphics and copy:**
1. Open **`src/components/HoverCard.jsx`**.
2. **Update the Thumbnail:** Find the `<img />` tag and replace the `src` attribute with your local asset or URL:
   ```javascript
   <img 
     src="/images/my-game-thumbnail.jpg" // <-- UPDATE THIS
     alt="Game Thumbnail" 
     className="cgs-card-image"
   />
   ```
3. **Update the Text:** Find the `<h3>` and `<p>` elements further down to change the game title or subtitle:
   ```javascript
   <div className="cgs-card-info">
     <h3 className="cgs-card-title">My Awesome Game</h3>
     <div className="cgs-card-indicator">PLAY NOW</div>
   </div>
   ```

## 3. Advanced: Unique Cards per Machine
Currently, all machines display the same promotional layout. If you want *each* machine to show a completely different game:

1. In `ShopModel.jsx`, the `hoveredNode` state contains the exact 3D mesh being hovered (e.g., `hoveredNode.name` will be `"Arcade_Cabinet1"`, `"Arcade_Cabinet2"`, etc.).
2. You can create a dictionary mapping these names to specific game data:
   ```javascript
   const GAMES_DATA = {
     "Arcade_Cabinet1": { title: "Cyber Strike", image: "/img1.jpg", url: "..." },
     "Arcade_Cabinet2": { title: "Neon Rider", image: "/img2.jpg", url: "..." }
   };
   ```
3. Then, pass the specific data down into the `<HoverCard>` component dynamically:
   ```javascript
   const gameInfo = GAMES_DATA[hoveredNode?.name] || DEFAULT_GAME;

   <HoverCard 
     title={gameInfo.title}
     image={gameInfo.image}
     onClick={() => window.open(gameInfo.url, "_blank")}
   />
   ```
