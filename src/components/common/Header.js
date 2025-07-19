import React from 'react';
import { User, LogOut, Folder, List, Layers, ChevronUp, ChevronDown, Archive, Moon, Sun } from 'lucide-react';
import { DENSITY_MODES, VIEW_MODES, DISPLAY_MODES, SORT_OPTIONS, THEME_MODES } from '../../utils/constants';
import { getDensityClasses } from '../../utils/helpers';

const Header = ({
    user,
    density,
    setDensity,
    theme,
    setTheme,
    view,
    setView,
    projectDisplayMode,
    setProjectDisplayMode,
    taskSort,
    setTaskSort,
    weekViewOpen,
    setWeekViewOpen,
    onLogout
}) => {
    const densityIcon = {
        comfortable: <Layers size={16} />,
        compact: <ChevronUp size={16} />,
        'ultra-compact': <ChevronDown size={16} />
    };

    const nextDensity = {
        comfortable: DENSITY_MODES.COMPACT,
        compact: DENSITY_MODES.ULTRA_COMPACT,
        'ultra-compact': DENSITY_MODES.COMFORTABLE
    };

    return (
        <div className={`${theme === THEME_MODES.DARK
            ? 'bg-gray-800 text-gray-100'
            : 'bg-white text-gray-800'
            } rounded-lg shadow-sm ${getDensityClasses(density, 'padding')} ${getDensityClasses(density, 'margin')} relative`}>

            {/* Logout Button - Small square in upper right */}
            <button
                onClick={onLogout}
                className={`absolute top-2 right-2 p-1.5 rounded transition-colors ${theme === THEME_MODES.DARK
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                title="Log out"
            >
                <LogOut size={16} />
            </button>

            {/* Display Controls and Theme Button */}
            <div className={`flex items-center gap-2 mb-3 pr-12 ${getDensityClasses(density, 'marginSmall')}`}>
                {/* Column Selection Buttons - moved to left, removed "Display:" text */}
                {view === VIEW_MODES.PROJECT && (
                    <>
                        {Object.entries({
                            [DISPLAY_MODES.AUTO]: 'Auto',
                            [DISPLAY_MODES.THREE_COLUMNS]: '3 Col',
                            [DISPLAY_MODES.TWO_COLUMNS]: '2 Col',
                            [DISPLAY_MODES.ONE_COLUMN]: '1 Col'
                        }).map(([mode, label]) => (
                            <button
                                key={mode}
                                onClick={() => setProjectDisplayMode(mode)}
                                className={`${getDensityClasses(density, 'buttonSmall')} ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} rounded ${projectDisplayMode === mode
                                    ? (theme === THEME_MODES.DARK ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white')
                                    : (theme === THEME_MODES.DARK
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                        {/* Theme Button - same size as column buttons */}
                        <button
                            onClick={() => setTheme(theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT)}
                            className={`${getDensityClasses(density, 'buttonSmall')} ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} rounded ${theme === THEME_MODES.DARK
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            title={`Switch to ${theme === THEME_MODES.LIGHT ? 'dark' : 'light'} theme`}
                        >
                            {theme === THEME_MODES.LIGHT ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                    </>
                )}

                {view === VIEW_MODES.TASK && (
                    <>
                        {Object.entries({
                            [SORT_OPTIONS.CUSTOM]: 'Custom',
                            [SORT_OPTIONS.CREATED]: 'Recent',
                            [SORT_OPTIONS.DUE]: 'Due Date'
                        }).map(([sort, label]) => (
                            <button
                                key={sort}
                                onClick={() => setTaskSort(sort)}
                                className={`${getDensityClasses(density, 'buttonSmall')} ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} rounded ${taskSort === sort
                                    ? (theme === THEME_MODES.DARK ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white')
                                    : (theme === THEME_MODES.DARK
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                        {/* Theme Button - same size as sort buttons */}
                        <button
                            onClick={() => setTheme(theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT)}
                            className={`${getDensityClasses(density, 'buttonSmall')} ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} rounded ${theme === THEME_MODES.DARK
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            title={`Switch to ${theme === THEME_MODES.LIGHT ? 'dark' : 'light'} theme`}
                        >
                            {theme === THEME_MODES.LIGHT ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                    </>
                )}

                {/* For Archive view, just show theme button */}
                {view === VIEW_MODES.ARCHIVE && (
                    <button
                        onClick={() => setTheme(theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT)}
                        className={`${getDensityClasses(density, 'buttonSmall')} ${density === DENSITY_MODES.ULTRA_COMPACT ? 'text-xs' : 'text-sm'} rounded ${theme === THEME_MODES.DARK
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        title={`Switch to ${theme === THEME_MODES.LIGHT ? 'dark' : 'light'} theme`}
                    >
                        {theme === THEME_MODES.LIGHT ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                )}

                {/* Density Button */}
                <button
                    onClick={() => setDensity(nextDensity[density])}
                    className={`ml-auto flex items-center gap-1.5 ${getDensityClasses(density, 'buttonSmall')} rounded-lg transition-colors text-sm ${theme === THEME_MODES.DARK
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    title={`Switch to ${nextDensity[density]} view`}
                >
                    {densityIcon[density]}
                    <span className="hidden sm:inline capitalize">{density.replace('-', ' ')}</span>
                </button>
            </div>

            {/* View Toggle */}
            <div className={`flex ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'marginSmall')}`}>
                <button
                    onClick={() => setView(VIEW_MODES.PROJECT)}
                    className={`flex items-center ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'button')} ${getDensityClasses(density, 'text')} ${getDensityClasses(density, 'rounded')} transition-colors ${view === VIEW_MODES.PROJECT
                        ? 'bg-blue-500 text-white'
                        : theme === THEME_MODES.DARK
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Folder size={getDensityClasses(density, 'iconSizeSmall')} />
                    <span className="hidden sm:inline">Project View</span>
                    <span className="sm:hidden">Projects</span>
                </button>
                <button
                    onClick={() => setView(VIEW_MODES.TASK)}
                    className={`flex items-center ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'button')} ${getDensityClasses(density, 'text')} ${getDensityClasses(density, 'rounded')} transition-colors ${view === VIEW_MODES.TASK
                        ? 'bg-blue-500 text-white'
                        : theme === THEME_MODES.DARK
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <List size={getDensityClasses(density, 'iconSizeSmall')} />
                    <span className="hidden sm:inline">Task View</span>
                    <span className="sm:hidden">Tasks</span>
                </button>
                <button
                    onClick={() => setView(VIEW_MODES.ARCHIVE)}
                    className={`flex items-center ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'button')} ${getDensityClasses(density, 'text')} ${getDensityClasses(density, 'rounded')} transition-colors ${view === VIEW_MODES.ARCHIVE
                        ? 'bg-blue-500 text-white'
                        : theme === THEME_MODES.DARK
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Archive size={getDensityClasses(density, 'iconSizeSmall')} />
                    <span className="hidden sm:inline">Archive</span>
                    <span className="sm:hidden">Archive</span>
                </button>
                <button
                    onClick={() => setWeekViewOpen(!weekViewOpen)}
                    className={`flex items-center ${getDensityClasses(density, 'gap')} ${getDensityClasses(density, 'button')} ${getDensityClasses(density, 'text')} ${getDensityClasses(density, 'rounded')} transition-colors ml-auto ${weekViewOpen
                        ? 'bg-green-500 text-white'
                        : theme === THEME_MODES.DARK
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <svg width={getDensityClasses(density, 'iconSizeSmall')} height={getDensityClasses(density, 'iconSizeSmall')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span className="hidden sm:inline">Week View</span>
                    <span className="sm:hidden">Week</span>
                </button>
            </div>

            <div className={`mt-2 text-xs ${theme === THEME_MODES.DARK ? 'text-gray-400' : 'text-gray-500'
                } ${density === DENSITY_MODES.ULTRA_COMPACT ? 'hidden' : ''}`}>
                Keyboard shortcuts: (N) New task, (P) New project, (V) Toggle view, (D) Density, (T) Theme, (W) Week view
            </div>
        </div>
    );
};

export default Header;
