class PackageSummary {

	parse(json) {
		this.data = {
			general: {},
			citation: '',
			projects: [],
			keywords: [],
			rights: []
		};

		// Parse general
		this.data['general'] = {
			name:             extractString(json, 'dataset > shortName'),
			id:               extractString(json, '_packageId'),
			alternate_id:     extractList(json, 'dataset > alternateIdentifier'),
			abstract:         this.parseAbstract(json['dataset'], ['abstract', 'abstract > section']),
			publication_date: extractString(json, 'dataset > pubDate'),
			language:         extractString(json, 'dataset > language'),
			time_range: {
				start: extractString(json, 'dataset > coverage > temporalCoverage > rangeOfDates > beginDate > calendarDate'),
				end:   extractString(json, 'dataset > coverage > temporalCoverage > rangeOfDates > endDate > calendarDate')
			}
		};

		// Parse citation
		let citation = '';
		let creators = extractList(json, 'dataset > creator');
		let first_author = true;

		for (let i in creators) {
			// Include sbclter organization (only if no creator) and other organization
			if (creators[i]['organizationName'] && !(creators[i]['organizationName'] == 'Santa Barbara Coastal LTER' && creators.length > 1)) {
				citation += creators[i]['organizationName'] + '. ';
			}

			if (creators[i]['individualName']) {
				let format = first_author ? '%L, %f, ' : '%f. %L, ';
				citation += parseName(creators[i]['individualName'], format);

				first_author = false;
			}
		}
		citation = removeLastDelim(citation, ', ', '. ');

		citation += extractString(json, 'dataset > pubDate').split('-')[0]             + '. ' +
					extractString(json, 'dataset > title')                             + ' ' +
					'ver ' + extractString(json, '_packageId').split('.').slice(-1)[0] + '. ' +
					'Environmental Data Initiative'                                    + '. ' +
					extractString(json, 'dataset > alternateIdentifier')               + '. ' +
					'Accessed ' + this.formatCitationDate(new Date())                  + '.';
		this.data['citation'] = citation;

		// Parse project
		let projects = extractList(json, 'dataset > project');

		for (let i in projects) {
			this.data['projects'].push({
				'abstract': this.parseAbstract(projects[i], ['abstract', 'abstract > section']),
				'funding': this.parseAbstract(projects[i], ['funding', 'funding > section']),
				'title': extractString(projects[i], 'title'),
				'personnels': people.parsePeopleData(extractList(projects[i], 'personnel'))
			});
		}

		// Parse keywords
		let keywords = json['dataset']['keywordSet'];
		for (let i in keywords) {
			let key = extractString(keywords[i]['keywordThesaurus']);
			let val = extractList(keywords[i]['keyword']);
			this.data['keywords'].push([key, val]);
		}

		// Parse rights
		let rights = extractList(json, 'dataset > intellectualRights > para > itemizedlist > listitem', ['para']);

		if (rights.length == 0)
			rights = extractList(json, 'dataset > intellectualRights > para');

		this.data['rights'] = rights;
	}

	build(template) {
		let element = template.find('#content-class-summary');
		let content = null;

		// fill shortname field
		content = this.data['general']['name'];
		element.find('#field-shortname').html(content);

		// fill id field
		content = this.data['general']['id']
		element.find('#field-id').text(content);

		// fill alternate id field
		content = this.data['general']['alternate_id'].join('<br>');
		element.find('#field-id-alt').html(content);

		// fill abstract field
		let abstract_data = this.data['general']['abstract'];
		content = this.buildAbstract(abstract_data);

		element.find('#field-abstract').html(content);

		// fill publication date field
		content = this.data['general']['publication_date'];
		element.find('#field-pubdate').html(content);

		// fill language field
		content = this.data['general']['language'];
		element.find('#field-language').html(content);

		// fill time period field
		content = extractString(this.data, 'general > time_range', ['start', 'end'], ' to ');
		element.find('#field-daterange').html(content);

		// fill citation field
		content = this.data['citation'];
		element.find('#field-citation').html(content);

		// fill project field
		content = '';
		for (let i in this.data['projects']) {
			let project = this.data['projects'][i];

			content += `
				<table class="table">
					<tbody>
						${ makeTableRow([['th', '', 'Title'], ['td', 'col-10', project['title']]]) }
						${ makeTableRow([['th', '', 'Abstract'], ['td', 'col-10', this.buildAbstract(project['abstract'])]]) }
						${ makeTableRow([['th', '', 'Funding'], ['td', 'col-10', this.buildAbstract(project['funding'])]]) }
					</tbody>
				</table>

				<div class="row people-table-wrap">
				${ people.makePeopleTables(project['personnels']) }
				</div>
			`;
		}

		// Add click event for project title
		element.find('#project-title').on('click', function (e) {
			$(this).find('.icon.collapse-icon').toggleClass('hidden');
			$(this).find('.icon.expand-icon').toggleClass('hidden');
		});

		element.find('#field-project').html(content);

		// fill keywords field
		for (let i in this.data['keywords']) {
			let key = this.data['keywords'][i][0];
			let val = this.data['keywords'][i][1].join(', ');

			let row;
			if (key == "" || key == "none")
				row = makeTableRow([['td', 'col-12', val]]);
			else
				row = makeTableRow([['th', 'col-4', key], ['td', 'col-8', val]]);

			element.find('#field-keywords').append(row);
		}

		// fill rights field
		for (let i in this.data['rights']) {
			element.find('#field-usage-rights').append(`<li> ${ this.data['rights'][i] } </li>`);
		}
	}

	parseAbstract(json, path) {
		let abstract = extractList(json, path);
		let abstract_data = [];

		for (let i in abstract) {
			let abstract_titles = extractList(abstract[i], ['title']);
			let abstract_paragraphs = extractList(abstract[i], ['para']);

			if (abstract_titles.length > 0 || abstract_paragraphs.length > 0) {
				abstract_data.push({
					title:     abstract_titles,
					paragraph: abstract_paragraphs
				});
			}
		}

		return abstract_data;
	}

	buildAbstract(abstract_data) {
		let content = '';

		for (let i in abstract_data) {
			let abstract_title = abstract_data[i].title.join('<br><br>');

			if (abstract_title != '') {
				content += `<strong>${ abstract_title }</strong><br>`;
			}
			content += extractString(abstract_data[i].paragraph, '', [''], '<br><br>') + '<br><br>';
		}

		return content;
	}

	// https://stackoverflow.com/a/23593099/8443192
	formatCitationDate(date) {
	    let d = new Date(date),
	        month = '' + (d.getMonth() + 1),
	        day = '' + d.getDate(),
	        year = d.getFullYear();

	    if (month.length < 2)
	        month = '0' + month;
	    if (day.length < 2)
	        day = '0' + day;

	    return [year, month, day].join('-');
	}
}
