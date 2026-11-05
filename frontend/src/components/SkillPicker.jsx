import { useState } from 'react';

export const SKILLS = [
  'Java', 'C++', 'Python', 'JavaScript', 'HTML', 'CSS', 'React', 'Node.js',
  'Express', 'MongoDB', 'SQL', 'Git/GitHub', 'DSA', 'OOP', 'DBMS',
  'Operating Systems', 'Computer Networks', 'Data Science', 'Machine Learning',
  'Power BI', 'Excel', 'Figma', 'AWS', 'Docker',
];

export default function SkillPicker({ value = [], onChange }) {
  const [custom, setCustom] = useState('');

  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  const has = (s) => value.some((v) => same(v, s));

  const toggle = (s) =>
    onChange(has(s) ? value.filter((v) => !same(v, s)) : [...value, s]);

  const addCustom = () => {
    const s = custom.trim();
    if (s && !has(s)) onChange([...value, s]);
    setCustom('');
  };

  // Skills saved earlier that are not in the standard list
  const extras = value.filter((v) => !SKILLS.some((s) => same(s, v)));
  const all = [...SKILLS, ...extras];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {all.map((s) => {
          const on = has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`text-sm px-3 py-1 rounded-full border ${
                on
                  ? 'bg-navy text-blush border-navy'
                  : 'bg-white text-navy border-pink hover:bg-pink'
              }`}
            >
              {on ? '✓ ' : ''}
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Other skill"
          className="flex-1 border border-pink rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-4 border border-navy text-navy rounded hover:bg-pink"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-prune mt-2">{value.length} selected</p>
    </div>
  );
}