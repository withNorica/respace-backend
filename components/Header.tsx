/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 text-center">
      <div className="flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100">
            ReSpace Design
          </h1>
      </div>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
        Upload a photo of your room, choose a style, and let AI generate a new design concept for you.
      </p>
    </header>
  );
};

export default Header;