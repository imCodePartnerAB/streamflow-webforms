/*
 *
 * Copyright 2009-2012 Jayway Products AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var nameMap = {
	Possible : 'Selected',
	Selected : 'Possible'
};

/**
 * Module that handles the setup of all the field types
 */
var FieldTypeModule = (function() {
	var inner = {};

	function requestModule() {
		if ( FormModule.isSecondSigningFlow() ) {
			return TaskRequestModule;
		} else {
			return RequestModule;
		}
	}
	
	function currentPage() {
		return parseInt(location.hash.substring(1));
	}

	function safeIdString(value) {
		return value.replace(/\W/g, '');
	}

	function listBoxArrow(id, toBox, emptyFunction) {
		var fromBox = nameMap[toBox] + id;
		$('#' + toBox + id).append($('#' + fromBox + ' > option:selected'));
	}

	function clone(id, newId) {
		if (!newId)
			return $('#' + id).clone().attr('id', id + 'Cloned');
		return $('#' + id).clone().attr('id', newId);
	}

	/** All field type functions * */
	function AttachmentFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		controlsNode.append(field.node);

		field.refreshUI = function() {

			var fieldId = this.id;
			if (this.formattedValue) {
				$("#AttachmentFieldValueForm" + fieldId).remove();

				var valueNode = clone("AttachedFile", "AttachedFile" + fieldId);
				field.node.append(valueNode);

				this.node.find('#delete_link').attr({
					id : 'delete_link' + fieldId
				}).click(
						function() {
							requestModule().deleteAttachment(JSON
									.parse(field.value).attachment)
							field.value = "";
							update(field.id, field.value);
							return false;
						});
				this.node.find('.filename').text(this.formattedValue);

			} else {
				$("#AttachedFile" + fieldId).remove();

				var formNode = clone("AttachmentFieldValueForm",
						"AttachmentFieldValueForm" + fieldId);
				field.node.append(formNode);

				formNode.find('#Attachment').attr({
					id : 'Attachment' + fieldId,
					name : fieldId
				});
				formNode.find('#button-text').text(texts.add_file);

				// Initialize the jQuery File Upload widget
				formNode.fileupload({
					dropZone : null
				});

				// Disable default dropzone
				$(document).bind('drop dragover', function(e) {
					e.preventDefault();
				});

				// Settings
				var url = UrlModule.attach();
				formNode.fileupload('option', {
					acceptFileTypes : /(\.|\/)(jpe?g|png|pdf)$/i,
					autoUpload : true,
					url : url
				});

				formNode.bind('fileuploaddone', function(e, data) {
					FormModule.setValue(field.id, requestModule()
							.refreshField(fieldId));
					field.refreshUI();
					removeErrorFromField(controlsNode.parent(), field);
				});

				formNode.bind('fileuploadadded', function(e, data) {
					if (!data.isValidated) {
						$.each(data.files, function(index, file) {
							addErrorToField(field, texts[file.error]);
						});
					}

				});
			}
		}

	}

	function selectedValues(input) {
		var values = new Array();
		if (!input)
			return values;
		var i = 0;
		input.replace(/(\[.*?\])/g, function(a, b) {
			values[i] = b.substring(1, b.length - 1);
			i++;
			return "";
		});

		$.each(input.split(", "), function(idx, selectionValue) {
			values[i] = selectionValue;
			i++;
		});
		return values;
	}

	function CheckboxesFieldValue(field, controlsNode) {
		field.node = controlsNode;
		field.node.addClass('well');
		$.each(field.fieldValue.values, function(idx, value) {
			var selectionId = field.id + safeIdString(value);
			var element = clone('checkbox', 'label' + selectionId);
			element.find('input').attr('id', selectionId).click(function() {
				field.changed().update();
			});
			element.append(value);
			field.node.append(element);
		});
		field.node.change(function() {
			field.formattedValue = "TST"
		});

		field.refreshUI = function() {
			var values = selectedValues(field.value);
			$.each(values, function(idx, selectionValue) {
				field.node.find('#' + field.id + safeIdString(selectionValue))
						.attr('checked', 'checked');
			});
		}

		field.getUIValue = function() {
			return $.map($('#Field' + field.id + ' input:checked'),
					function(elm) {
						var value = $('#label' + elm.id).text();
						if (value.indexOf(",") != -1) {
							return "[" + value + "]";
						} else {
							return value;
						}
					}).join(', ');
		}
	}

	function ComboBoxFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		field.node.append($('<option />'));
		$.each(field.fieldValue.values, function(idx, value) {
			var selectionId = field.id + safeIdString(value);
			field.node.append($('<option />').attr({
				value : value,
				id : selectionId
			}).text(value));
		});
		field.node.change(function() {
			field.changed().update();
		});
		controlsNode.append(field.node);
		field.refreshUI = function() {
			field.node.find('#' + field.id + safeIdString(this.value)).attr(
					'selected', 'selected');
		}

		field.getUIValue = function() {
			return field.node.find('option:selected').text();
		}
	}

	function CommentFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		field.node.append(field.field.field.note);
		field.name = "";
		field.refreshUI = $.noop;
		controlsNode.append(field.node);
	}

	function DateFieldValue(field, controlsNode) {
		var containerNode = clone('datefieldcontainer', "datecontainer-"
				+ field.id);
		field.node = clone('datefield', field.id);
		field.node.change(function() {
			removeErrorFromField(controlsNode.parent(), field);
			field.invalidformat = '';
			field.formattedValue = field.getUIValue();
			if (field.formattedValue != '') {
				try {
					field.value = $.datepicker.parseDate('yy-mm-dd',
							field.formattedValue).format(
							"UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'");
				} catch (e) {
					field.invalidformat = texts.invaliddate;
					addErrorToField(field, field.invalidformat);
				}
			}
			update(field.id, field.value);
		});
		field.node.datepicker();
		containerNode.find('button').click(function() {
			field.node.datepicker("show");
		});
		containerNode.prepend(field.node);
		controlsNode.append(containerNode);
	}

	function FieldGroupFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		controlsNode.append(field.node);
	}

	function ListBoxFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		var possible = field.node.find('#possiblevalues').attr({
			id : 'Possible' + field.id
		});
		var selected = field.node.find('#selectedvalues').attr({
			id : 'Selected' + field.id
		});
		var buttons = field.node.find('#listboxbuttons');
		new View.Button(buttons).image('icon-arrow-right').click(function() {
			listBoxArrow(field.id, 'Selected');
			field.changed().update();
			selected.focus();
			return false;
		});
		buttons.append('<br/>');
		new View.Button(buttons).image('icon-arrow-left').click(function() {
			listBoxArrow(field.id, 'Possible');
			field.changed().update();
			possible.focus();
			return false;
		});

		$.each(field.fieldValue.values, function(idx, value) {
			var optionNode = $('<option />').attr('id',
					field.id + safeIdString(value)).text(value);
			possible.append(optionNode);
		});
		controlsNode.append(field.node);

		field.refreshUI = function() {
			var values = selectedValues(field.value);
			$.each(values, function(idx, selectionValue) {
				selected.append(field.node.find('#' + field.id
						+ safeIdString(selectionValue)));
			});
			
		}

		field.getUIValue = function() {
			var val = $.map(
					field.node.find('#Selected' + field.id + ' > option'),
					function(elm) {
						if (elm.text.indexOf(",") != -1) {
							return "[" + elm.text + "]";
						} else {
							return elm.text;
						}
					}).join(', ');
			return val;
		}
	}

	function NumberFieldValue(field, controlsNode) {
		field.node = clone('textfield', field.id);
		field.node.change(function() {
			field.changed();
		});
		field.node.blur(function() {
			if (!field.dirty)
				return;
			removeErrorFromField(controlsNode.parent(), field);
			field.invalidformat = "";
			var enteredValue = field.getUIValue();
			update(field.id, enteredValue);

			var updatedValue = field.getUIValue();
			var serverValue = requestModule().refreshField(field.id);
			if (field.dirty = (updatedValue != serverValue)) {
				field.setUIValue(enteredValue);
				field.invalidformat = texts.invalidformat;
				addErrorToField(field, field.invalidformat);
			}
		});
		controlsNode.append(field.node);
	}

	function OptionButtonsFieldValue(field, controlsNode) {
		field.node = controlsNode;
		field.node.addClass('well');
		$.each(field.fieldValue.values, function(idx, value) {
			var selectionId = field.id + safeIdString(value);
			var element = clone('radio', 'label' + selectionId);
			element.find('input').attr({
				'id' : selectionId,
				'name' : field.id
			}).click(function() {
				field.changed().update();
			});
			element.append(value);
			field.node.append(element);
		});

		field.refreshUI = function() {
			field.node.find('#' + field.id + safeIdString(this.value)).attr(
					'checked', 'checked');
		}

		field.getUIValue = function() {
			return $.map($('#Field' + field.id + ' input:checked'),
					function(elm) {
						return $('#label' + elm.id).text()
					}).join(', ');
		}
	}

	function OpenSelectionFieldValue(field, controlsNode) {
		field.node = controlsNode;
		field.node.addClass('well');
		$.each(field.fieldValue.values, function(idx, value) {
			var selectionId = field.id + safeIdString(value);
			var element = clone('radio', 'label' + selectionId);
			element.find('input').attr({
				'id' : selectionId,
				'name' : field.id
			}).click(function() {
				textfield.attr({
					value : '',
					disabled : true
				});
				field.changed().update();
			});
			element.append(value);
			field.node.append(element);
		});

		var id = 'openSelectionOption' + field.id;
		var option = clone('radio', 'label' + id);
		option.find('input').attr({
			'id' : id,
			'name' : field.id,
			'class' : 'openselection-radio'
		}).click(function() {
			textfield.removeAttr('disabled');
		});
		option.append(field.fieldValue.openSelectionName);

		var textfield = clone('textfield', 'TextField' + field.id);
		textfield.addClass('openselection-text');
		textfield.change(function() {
			field.changed();
		});
		textfield.blur(function() {
			field.update();
		});
		option.append(textfield);
		field.node.append(option);

		field.refreshUI = function() {
			var selected = field.node.find(
					'#' + field.id + safeIdString(this.value)).attr('checked',
					'checked');
			if (selected.size() == 0 && this.value) {
				field.node.find('#openSelectionOption' + field.id).attr(
						'checked', 'checked');
				field.node.find('#TextField' + field.id).attr("value",
						this.value);
			} else {
				field.node.find('#TextField' + field.id).attr({
					disabled : true,
					value : ""
				});
			}
		}

		field.getUIValue = function() {
			var fieldValue = $.map($('#Field' + field.id + ' input:checked'),
					function(elm) {
						return $('#label' + elm.id).text()
					}).join(', ');
			if (fieldValue == field.fieldValue.openSelectionName) {
				fieldValue = $('#TextField' + field.id).attr('value');
			}
			return fieldValue;
		}
	}

	function TextAreaFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		var maxWidth = $('#inserted_content').width();
		var cssWidth = field.fieldValue.cols * 7.3;
		field.node.css("width", cssWidth < maxWidth ? cssWidth : maxWidth)
		field.node.css("height", field.fieldValue.rows * 13);
		field.node.change(function() {
			field.changed();
		});
		field.node.blur(function() {
			field.update();
		});
		controlsNode.append(field.node);
	}

	function TextFieldValue(field, controlsNode) {
		field.node = clone("textfield", field.id);
		var maxWidth = $('#inserted_content').width();
		var cssWidth = field.fieldValue.width * 7.3;
		field.node.css("width", cssWidth < maxWidth ? cssWidth : maxWidth)
		field.node.change(function() {
			field.changed();
		});
		field.node.blur(function() {
			if (!field.dirty)
				return;
			removeErrorFromField(controlsNode.parent(), field);
			field.invalidformat = "";
			var value = field.value;
			update(field.id, field.value);

			var newValue = field.getUIValue();
			var serverValue = requestModule().refreshField(field.id);

			if (field.dirty = (newValue != serverValue)) {
				field.setUIValue(value);
				field.invalidformat = texts.invalidformat;
				addErrorToField(field, field.invalidformat);
			}
		});
		controlsNode.append(field.node);
	}

	function GeoLocationFieldValue(field, controlsNode) {
		field.node = clone(field.fieldType, field.id);
		
		var mapCanvas = field.node.find('#map-canvas').attr({
			id : 'map-canvas' + field.id
		});
		
		field.initMap = function() {
			field.marker = null;
			field.polyline = null;
			field.polygon = null;
			
			var mapOptions = {
				center : new google.maps.LatLng(56.660920, 12.879581),
				zoom : 11,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			};
			var map = new google.maps.Map(mapCanvas[0], mapOptions);
			field.map = map;
			
			var selectedDrawingModes = new Array();
			var initDrawingMode = null;
			if (field.mapValue) {
				if (field.mapValue.isPoint) {
					initDrawingMode = google.maps.drawing.OverlayType.MARKER;
				} else if (field.mapValue.isPolyline) {
					initDrawingMode = google.maps.drawing.OverlayType.POLYLINE;
				} else if (field.mapValue.isPolygon) {
					initDrawingMode = google.maps.drawing.OverlayType.POLYGON;
				}
			}
						   
			if (field.fieldValue.point) {
				selectedDrawingModes.push(google.maps.drawing.OverlayType.MARKER);
				if (!initDrawingMode) {
					initDrawingMode = google.maps.drawing.OverlayType.MARKER;
				}
			}
			if (field.fieldValue.polyline) {
				selectedDrawingModes.push(google.maps.drawing.OverlayType.POLYLINE);
				if (!initDrawingMode) {
					initDrawingMode = google.maps.drawing.OverlayType.POLYLINE;
				}
			}
			if (field.fieldValue.polygon) {
				selectedDrawingModes.push(google.maps.drawing.OverlayType.POLYGON);
				if (!initDrawingMode) {
					initDrawingMode = google.maps.drawing.OverlayType.POLYGON;
				}
			}
			var drawingManager = new google.maps.drawing.DrawingManager({
				drawingMode: initDrawingMode,
				drawingControlOptions: {
				    position: google.maps.ControlPosition.TOP_CENTER,
				    drawingModes: selectedDrawingModes
				},
				drawingControl: true,
				markerOptions: {
					draggable: true
				},
				
			});
			drawingManager.setMap(map);
			
			var clearCurrentMarkersAndLines = function() {
				if (field.marker) {
					field.marker.setMap(null);
				}
				if (field.polyline) {
					field.polyline.setMap(null);
				}
				if (field.polygon) {
					field.polygon.setMap(null);
				}
			}
			
			field.refreshUI();
			
			google.maps.event.addListener(drawingManager, 'markercomplete', function(newMarker) {
				clearCurrentMarkersAndLines();
				
				field.marker = newMarker;
				var position = newMarker.position.lat() + ", " + newMarker.position.lng();
				update( field.id, position);
				field.mapValue = MapModule.createMapValue(position);
			});
			
			google.maps.event.addListener(drawingManager, 'polylinecomplete', function(newLine) {
				clearCurrentMarkersAndLines();
				
				field.marker = newLine;
				var position = newLine.getPath().getArray().toString();
				update( field.id, position);
				field.mapValue = MapModule.createMapValue(position);
			});
			
			google.maps.event.addListener(drawingManager, 'polygoncomplete', function(newSurface) {
				clearCurrentMarkersAndLines();

				// Add the first position as the last so that we know that it's a surface
				newSurface.getPath().getArray().push(newSurface.getPath().getArray()[0]);
				field.marker = newSurface;
				var position = newSurface.getPath().getArray().toString();
				update( field.id, position);
				field.mapValue = MapModule.createMapValue(position);
			});

			google.maps.event.addListener(drawingManager, 'drawingmode_changed', function(){
				if (drawingManager.drawingMode != null) {
					clearCurrentMarkersAndLines();
				}
			}); 
		}
		
		field.refreshUI = function() {
			if (field.mapValue) {
				// Detect if it's a single point or a line/surface
				if (field.mapValue.isPoint) {
					if (field.marker) {
						field.marker.setMap(null);
					}
					field.marker = new google.maps.Marker({
					    position: new google.maps.LatLng(field.mapValue.path[0].latitude, field.mapValue.path[0].longitude),
					    map: field.map
					});
					
				} else {
					var path = new Array();
					$.each( field.mapValue.path, function(index, position) {
						path.push(new google.maps.LatLng(position.latitude, position.longitude));
					});
				
					if (field.mapValue.isPolyline) {
						field.polyline = new google.maps.Polyline();
						field.polyline.setPath(path);
						field.polyline.setMap( field.map );

					} else if (field.mapValue.isPolygon) {
						field.polygon = new google.maps.Polygon();
						field.polygon.setPath(path);
						field.polygon.setMap( field.map );
					}
				}
			}
		}
		
		controlsNode.append(field.node);
	}

	function removeErrorFromField(node, field) {
		node.removeClass("error");
		$('#help' + field.id).remove();
	}

	function addErrorToField(field, error) {
		removeErrorFromField(field.node.parent().parent(), field);
		field.node.parent().parent().addClass("error");
		var help = clone('help-inline', 'help' + field.id);
		help.append(error);
		field.node.parent().append(help);
	}

	inner.createFieldUI = function(field, node) {
		field.changed = function() {
			field.dirty = true;
			field.setValue(field.getUIValue());
			return field;
		};

		field.getUIValue = function() {
			var value = field.node.attr('value');
			return value == null ? '' : value;
		};

		field.refreshUI = function() {
			field.node.attr('value', field.formattedValue);
			if (field.invalidformat) {
				addErrorToField(field, field.invalidformat);
			}
		};

		field.setUIValue = function(value) {
			field.setValue(value);
			if (field.page.index == currentPage())
				field.refreshUI();
		};

		field.update = function() {
			if (field.dirty) {
				update(field.id, field.value);
				field.dirty = false;
			}
		};

		eval(field.fieldType + '(field, node)');
	}

	inner.updateField = function(id, value) {
		FormModule.getField(id).setUIValue(value);
	}

	return inner;
}());